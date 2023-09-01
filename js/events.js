import { uploadImage, getLowResolutionImage } from './API/api.js'



// El resto del código permanece igual


document.addEventListener('DOMContentLoaded', async () => {
    showImage();

    const uploadForm = document.getElementById('upload-form');
    const loadingModal = new bootstrap.Modal(document.getElementById('loadingModal'), {
        backdrop: 'static',
        keyboard: false
    });

    uploadForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        // Muestra el modal de carga
        loadingModal.show();

        const fileInput = document.getElementById('file-input');
        const file = fileInput.files[0];

        if (file) {
            try {
                const response = await uploadImage(file);
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
    // Obtener la URL del archivo .dzi y de los tiles desde el servidor FastAPI
    axios.get('http://127.0.0.1:8000/api/get_dzi_info').then(response => {
        const dziUrl = response.data.filename;
        const tilesBaseUrl = dziUrl.replace('.dzi', '_files/');

        // Hacer una petición para obtener el XML .dzi
        axios.get(dziUrl).then(response => {
            const dziData = response.data;
            const tileSource = tileSourceFromData(dziData, tilesBaseUrl);

            const viewer = OpenSeadragon({
                id: 'openseadragon1',
                prefixUrl: '//openseadragon.github.io/openseadragon/images/',
                tileSources: tileSource
            });
        }).catch(error => {
            // console.error('Error al cargar el .dzi:', error);
        });
    }).catch(error => {
        // console.error('Error al obtener información del DZI:', error);
    });
}
