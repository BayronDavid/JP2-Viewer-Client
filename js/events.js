import { uploadImage, getLowResolutionImage } from './API/api.js'

document.addEventListener('DOMContentLoaded', async() => {
    const img = await getLowResolutionImage();
    document.getElementById('img').src = URL.createObjectURL(img);

    
    const uploadForm = document.getElementById('upload-form');
    uploadForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Previene la acción por defecto del formulario

        const file = document.getElementById('file-input').files[0];
        if (file) {
            const response = await uploadImage(file);
            console.log(response);
        }
    });
});