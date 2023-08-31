import { uploadImage } from './API/api.js'

const handleUpload = async () => {
    const file = document.getElementById('inputGroupFile').files[0];
    if (file) {
        const response = await uploadImage(file);
        console.log(response);
    }
};