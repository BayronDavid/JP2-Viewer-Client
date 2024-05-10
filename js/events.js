let viewer = null;

document.addEventListener("DOMContentLoaded", async () => {
  const imageList = document.getElementById("imageList");
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
      imageList.innerHTML = "";

      images.forEach((image) => {
        const listItem = document.createElement("div");
        listItem.className = "image-container list-group-item";

        // Contenido del contenedor de la imagen
        listItem.innerHTML = `
          <img src="${image.thumbnail_url}" alt="${image.filename}" class="img-thumbnail">
          <div class="image-details">${image.filename}</div>
          <button class="btn btn-danger btn-sm delete-button" data-image-id="${image.id}"><i class="fa-solid fa-trash"></i></button>
        `;

        listItem.querySelector("img").crossOrigin = "Anonymous";

        // Agregar evento de clic para cargar la imagen en el visor
        listItem.querySelector("img").addEventListener("click", () => {
          // Eliminar la clase 'selected' de todas las imágenes
          const allImages = document.querySelectorAll(".img-thumbnail");
          allImages.forEach((img) => img.classList.remove("selected"));

          // Agregar la clase 'selected' a la imagen clicada
          listItem.querySelector("img").classList.add("selected");

          showImage(image.id);
        });

        // Agregar evento de clic para eliminar la imagen
        listItem
          .querySelector(".delete-button")
          .addEventListener("click", async (event) => {
            const imageId = event.target.getAttribute("data-image-id");
            await deleteImage(imageId);

            // Recargar la lista de imágenes después de eliminar
            loadImages();
          });

        imageList.appendChild(listItem);
      });

      loadingModal.hide();
      // Mostrar la primera imagen en el visor por defecto
      if (images.length > 0) {
        // Obtener el primer elemento de la lista
        const firstImageListItem = imageList.querySelector(".image-container");

        // Agregar la clase 'selected' a la imagen
        firstImageListItem.querySelector("img").classList.add("selected");

        // Mostrar la primera imagen en el visor
        showImage(images[0].id);
      }
    } catch (error) {
      console.error("Error al cargar la lista de imágenes:", error);
    }
  };

  const showImage = async (imageId) => {
    logMessage(`Cargando imagen ${imageId}...`);
    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/dzi/${imageId}.dzi`
      );
      const dziData = response.data;
      const tilesBaseUrl = `http://127.0.0.1:8000/dzi/${imageId}_files/`;
      const tileSource = tileSourceFromData(dziData, tilesBaseUrl);

      tileSource.crossOriginPolicy = "Anonymous";

      if (viewer) {
        viewer.destroy();
      }

      viewer = OpenSeadragon({
        id: "openseadragon1",
        // prefixUrl: "//openseadragon.github.io/openseadragon/images/",
        prefixUrl:
          "https://cdn.jsdelivr.net/gh/Benomrans/openseadragon-icons@main/images/",

        tileSources: tileSource,
        filters: true,
      });

      const anno = OpenSeadragon.Annotorious(viewer);

      // Cargar anotaciones
      anno.loadAnnotations("http://127.0.0.1:8000/api/annotations/" + imageId);

      anno.on("createAnnotation", async (annotation) => {
        logMessage("Creando anotación...");
        try {
          await axios.post(
            `http://127.0.0.1:8000/api/annotations/${imageId}`,
            annotation
          );
          logMessage("Anotación añadida con éxito.");
        } catch (error) {
          console.error("Error al guardar la anotación:", error);
          logMessage("Error al guardar la anotación.");
        }
      });

      anno.on("updateAnnotation", async (annotation, previous) => {
        // console.log(
        //   `http://127.0.0.1:8000/api/annotations/${imageId}/${previous.id}`,
        //   annotation
        // );
        logMessage("Actualizando anotación...");
        const encodedAnnotationId = encodeURIComponent(previous.id);
        try {
          await axios.put(
            `http://127.0.0.1:8000/api/annotations/${imageId}/${encodedAnnotationId}`,
            annotation
          );
          logMessage("Anotación actualizada con éxito.");
        } catch (error) {
          console.error("Error al actualizar la anotación:", error);
          logMessage("Error al actualizar la anotación.");
        }
      });

      anno.on("deleteAnnotation", async (annotation) => {
        logMessage("Eliminando anotación...");
        const encodedAnnotationId = encodeURIComponent(annotation.id);
        try {
          await axios.delete(
            `http://127.0.0.1:8000/api/annotations/${imageId}/${encodedAnnotationId}`
          );
          logMessage("Anotación eliminada con éxito.");
        } catch (error) {
          console.error("Error al eliminar la anotación:", error);
          logMessage("Error al eliminar la anotación.");
        }
      });

      viewer.addHandler("tile-loaded", function (event) {
        logMessage(`Tile cargado: ${event.tile.getUrl()}`);
      });
    } catch (error) {
      console.error(`Error al cargar la imagen ${imageId}:`, error);
      logMessage(`Error al cargar la imagen ${imageId}: ${error}`);
    }
  };

  const deleteImage = async (imageId) => {
    try {
      const response = await axios.delete(
        `http://127.0.0.1:8000/api/delete_image/${imageId}`
      );
      console.log(
        response.data.message,
        `http://127.0.0.1:8000/api/delete_image/${imageId}`
      );
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

function applyCustomFilter() {
  const convolutionMatrix = document.getElementById('convolutionMatrix').value;
  if (convolutionMatrix.trim() === '') {
    alert('Por favor, ingrese una matriz de convolución.');
    return;
  }

  const matrix = convolutionMatrix.split(',').map(parseFloat);
  if (matrix.length !== 9 || matrix.some(isNaN)) {
    alert('La matriz de convolución ingresada no es válida. Por favor, ingrese una matriz de 3x3.');
    return;
  }

  viewer.setFilterOptions({
    filters: {
      processors: OpenSeadragon.Filters.CONVOLUTION(matrix)
    }
  });
}

function applyPresetFilter(filterType) {
  let matrix;
  switch (filterType) {
    case "sharpen":
      matrix = [0, -1, 0, -1, 5, -1, 0, -1, 0];
      break;
    case "blur":
      matrix = [1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9];
      break;
    case "edgeDetection":
      matrix = [-1, -1, -1, -1, 8, -1, -1, -1, -1];
      break;
    case "emboss":
      matrix = [-2, -1, 0, -1, 1, 1, 0, 1, 2];
      break;
    default:
      return;
  }

  viewer.setFilterOptions({
    filters: {
      processors: OpenSeadragon.Filters.CONVOLUTION(matrix),
    },
  });
}

function invert() {
  viewer.setFilterOptions({
    filters: {
      processors: OpenSeadragon.Filters.INVERT(),
    },
  });
}
