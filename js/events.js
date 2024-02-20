let viewer = null;

document.addEventListener('DOMContentLoaded', async () => {
    showImage();

    const uploadForm = document.getElementById('upload-form');
    const loadingModal = new bootstrap.Modal(document.getElementById('loadingModal'), {
        backdrop: 'static',
        keyboard: false
    });

    uploadForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    loadingModal.show();

    const fileInput = document.getElementById('file-input');
    const file = fileInput.files[0];
    const formatSelect = document.getElementById('format-select');
    const format = formatSelect.value; // Captura el formato seleccionado

    if (file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('format', format); // Incluye el formato en la solicitud

        try {
            const response = await axios.post('http://127.0.0.1:8000/upload/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            // Manejar respuesta...
        } catch (error) {
            console.log("Ocurrió un error durante la carga", error);
        } finally {
            loadingModal.hide();
            showImage();
        }
    }
});

});

const tileSourceFromData = function (data, filesUrl) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(data, "text/xml");

    const image = xmlDoc.getElementsByTagName("Image")[0];
    const size = xmlDoc.getElementsByTagName("Size")[0];

    const dzi = {
        Image: {
            xmlns: image.getAttribute('xmlns'),
            Url: filesUrl,
            Format: image.getAttribute('Format'),
            Overlap: image.getAttribute('Overlap'),
            TileSize: image.getAttribute('TileSize'),
            Size: {
                Height: size.getAttribute('Height'),
                Width: size.getAttribute('Width')
            }
        }
    };

    return dzi;
};


const showImage = function () {
    logMessage('Solicitando información DZI...');
    // Obtener la URL del archivo .dzi y de los tiles desde el servidor FastAPI
    axios.get('http://127.0.0.1:8000/api/get_dzi_info').then(response => {
        const dziUrl = response.data.filename;
        const tilesBaseUrl = dziUrl.replace('.dzi', '_files/');


        // Hacer una petición para obtener el XML .dzi
        axios.get(dziUrl).then(response => {
            const dziData = response.data;
            const tileSource = tileSourceFromData(dziData, tilesBaseUrl);


            // Destruye el visor actual si ya existe
            if (viewer) {
                viewer.destroy();
                viewer = null;
            }

            // Crea un nuevo visor
            viewer = OpenSeadragon({
                id: 'openseadragon1',
                prefixUrl: '//openseadragon.github.io/openseadragon/images/',
                tileSources: tileSource,
                zoomInButton: "zoom-in",
                zoomOutButton: "zoom-out",
                homeButton: "home",
                fullPageButton: "full-page",
                nextButton: "next",
                previousButton: "previous",
                // showNavigator: true,
                // navigatorPosition: "ABSOLUTE",
                // navigatorTop: "40px",
                // navigatorLeft: "4px",
                // navigatorHeight: "120px",
                // navigatorWidth: "145px",
                
            });

            viewer.addHandler('tile-loaded', function (event) {
                logMessage(` ${event.tile.url}`);
            });
        }).catch(error => {
            console.error('Error al cargar el .dzi:', error);
            logMessage(`Error al cargar el .dzi: ${error}`);
        });
    }).catch(error => {
        console.error('Error al obtener información del DZI:', error);
        logMessage(`Error al obtener información del DZI: ${error}`);
    });
}

function logMessage(message) {
    const logDiv = document.getElementById('logs');
    const timestamp = new Date().toLocaleString();  // Formato de fecha más legible
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = `<span class="log-timestamp">${timestamp}</span> - ${message}`;
    logDiv.appendChild(entry);

    // Auto-scroll al último mensaje
    logDiv.scrollTop = logDiv.scrollHeight;
    logDiv.scrollLeft = logDiv.scrollWidth - logDiv.clientWidth;
}
