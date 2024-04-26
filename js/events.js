let viewer = null;

document.addEventListener("DOMContentLoaded", async () => {
  const imageList = document.getElementById("image-list");
  const uploadForm = document.getElementById("upload-form");

  const loadingModal = new bootstrap.Modal(
    document.getElementById("loadingModal"),
    {
      backdrop: "static",
      keyboard: false,
    }
  );

  // Función para cargar la lista de imágeness
  const loadImages = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:8000/api/list_images");
      const images = response.data;
      imageList.innerHTML='';

      // Mostrar cada imagen en la lista con un botón de eliminar
      images.forEach((image) => {
        const listItem = document.createElement("div");
        listItem.className = "list-group-item";
        listItem.innerHTML = `
                    <img src="http://127.0.0.1:8000/dzi/${image.id}.dzi" alt="${image.filename}" class="img-thumbnail" style="cursor: pointer;">
                    <button class="btn btn-danger btn-sm float-end" data-image-id="${image.id}">Eliminar</button>
                `;
        imageList.appendChild(listItem);

        // Agregar evento de clic para cargar la imagen en el visor
        listItem.querySelector("img").addEventListener("click", () => {
          showImage(image.id);
        });

        // Agregar evento de clic para eliminar la imagen
        listItem
          .querySelector("button")
          .addEventListener("click", async (event) => {
            const imageId = event.target.getAttribute("data-image-id");
            await deleteImage(imageId);
            // Recargar la lista de imágenes después de eliminar
            imageList.innerHTML = "";
            loadImages();
          });
      });

      loadingModal.hide();
      // Mostrar la primera imagen en el visor por defecto
      if (images.length > 0) {
        showImage(images[0].id);
      }
    } catch (error) {
      console.error("Error al cargar la lista de imágenes:", error);
    }
  };

  // Función para cargar una imagen en el visor
  const showImage = async (imageId) => {
    logMessage(`Cargando imagen ${imageId}...`);
    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/dzi/${imageId}.dzi`
      );
      const dziData = response.data;
      const tilesBaseUrl = `http://127.0.0.1:8000/dzi/${imageId}_files/`;
      const tileSource = tileSourceFromData(dziData, tilesBaseUrl);

      // Destruye el visor actual si ya existe
      if (viewer) {
        viewer.destroy();
        viewer = null;
      }

      // Crea un nuevo visor
      viewer = OpenSeadragon({
        id: "openseadragon1",
        prefixUrl: "//openseadragon.github.io/openseadragon/images/",
        tileSources: tileSource,
        zoomInButton: "zoom-in",
        zoomOutButton: "zoom-out",
        homeButton: "home",
        fullPageButton: "full-page",
        nextButton: "next",
        previousButton: "previous",
      });

      viewer.addHandler("tile-loaded", function (event) {
        logMessage(` ${event.tile.getUrl()}`);
      });
    } catch (error) {
      console.error(`Error al cargar la imagen ${imageId}:`, error);
      logMessage(`Error al cargar la imagen ${imageId}: ${error}`);
    }
  };

  // Función para eliminar una imagen
  const deleteImage = async (imageId) => {
    try {
      const response = await axios.delete(
        `http://127.0.0.1:8000/api/delete_image/${imageId}`
      );
      console.log(response.data.message);
    } catch (error) {
      console.error(`Error al eliminar la imagen ${imageId}:`, error);
    }
  };

  uploadForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    loadingModal.show();

    const fileInput = document.getElementById("file-input");
    const file = fileInput.files[0];
    const formatSelect = document.getElementById("format-select");
    const format = formatSelect.value; // Captura el formato seleccionado

    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("format", format); // Incluye el formato en la solicitud

      try {
        const response = await axios.post(
          "http://127.0.0.1:8000/upload/",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        console.log("Imagen cargada con éxito");
        // listImages(); // Actualiza la lista de imágenes después de cargar una nueva imagen
        loadImages();
      } catch (error) {
        console.log("Ocurrió un error durante la carga", error);
      } finally {
        loadingModal.hide();
      }
    }
  });

  // Mostrar el modal de carga al iniciar
  loadingModal.show();

  // Cargar la lista de imágenes al cargar la página
  loadImages();
});

const tileSourceFromData = function (data, filesUrl) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(data, "text/xml");

  const image = xmlDoc.getElementsByTagName("Image")[0];
  const size = xmlDoc.getElementsByTagName("Size")[0];

  const dzi = {
    Image: {
      xmlns: image.getAttribute("xmlns"),
      Url: filesUrl,
      Format: image.getAttribute("Format"),
      Overlap: image.getAttribute("Overlap"),
      TileSize: image.getAttribute("TileSize"),
      Size: {
        Height: size.getAttribute("Height"),
        Width: size.getAttribute("Width"),
      },
    },
  };

  return dzi;
};

// const showImage = function () {
//     logMessage('Solicitando información DZI...');
//     // Obtener la URL del archivo .dzi y de los tiles desde el servidor FastAPI
//     axios.get('http://127.0.0.1:8000/api/get_dzi_info').then(response => {
//         const dziUrl = response.data.filename;
//         const tilesBaseUrl = dziUrl.replace('.dzi', '_files/');

//         // Hacer una petición para obtener el XML .dzi
//         axios.get(dziUrl).then(response => {
//             const dziData = response.data;
//             const tileSource = tileSourceFromData(dziData, tilesBaseUrl);

//             // Destruye el visor actual si ya existe
//             if (viewer) {
//                 viewer.destroy();
//                 viewer = null;
//             }

//             // Crea un nuevo visor
//             viewer = OpenSeadragon({
//                 id: 'openseadragon1',
//                 prefixUrl: '//openseadragon.github.io/openseadragon/images/',
//                 tileSources: tileSource,
//                 zoomInButton: "zoom-in",
//                 zoomOutButton: "zoom-out",
//                 homeButton: "home",
//                 fullPageButton: "full-page",
//                 nextButton: "next",
//                 previousButton: "previous",
//             });

//             viewer.addHandler('tile-loaded', function (event) {
//                 logMessage(` ${event.tile.getUrl()}`);
//             });
//         }).catch(error => {
//             console.error('Error al cargar el .dzi:', error);
//             logMessage(`Error al cargar el .dzi: ${error}`);
//         });
//     }).catch(error => {
//         console.error('Error al obtener información del DZI:', error);
//         logMessage(`Error al obtener información del DZI: ${error}`);
//     });
// }

function logMessage(message) {
  const logDiv = document.getElementById("logs");
  const timestamp = new Date().toLocaleString(); // Formato de fecha más legible
  const entry = document.createElement("div");
  entry.className = "log-entry";
  entry.innerHTML = `<span class="log-timestamp">${timestamp}</span> - ${message}`;
  logDiv.appendChild(entry);

  // Auto-scroll al último mensaje
  logDiv.scrollTop = logDiv.scrollHeight;
  logDiv.scrollLeft = logDiv.scrollWidth - logDiv.clientWidth;
}
