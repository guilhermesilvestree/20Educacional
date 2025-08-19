// Importa a instância do banco de dados do arquivo de configuração
import { db } from './firebase-config.js';
import { doc, collection, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/**
 * Gera um ID único para um novo documento em uma coleção do Firestore.
 * @param {string} collectionName - O nome da coleção.
 * @returns {string} O ID do novo documento.
 */
export function gerarIdDocumento(collectionName) {
    const newDocRef = doc(collection(db, collectionName));
    return newDocRef.id;
}

/**
 * Salva (ou sobrescreve) um documento com um ID específico em uma coleção do Firestore.
 * @param {string} collectionName - O nome da coleção.
 * @param {string} docId - O ID do documento a ser salvo.
 * @param {object} data - O objeto com os dados a serem salvos.
 * @returns {Promise<void>}
 */
export async function definirDocumento(collectionName, docId, data) {
    try {
        const docRef = doc(db, collectionName, docId);
        await setDoc(docRef, data);
        console.log(`Documento com ID ${docId} salvo com sucesso na coleção ${collectionName}.`);
    } catch (e) {
        console.error("Erro ao salvar documento: ", e);
        throw e;
    }
}

/**
 * Faz o upload de um arquivo para o Cloudinary.
 * @param {File} file - O objeto do arquivo a ser enviado.
 * @param {string} publicFilename - O nome de arquivo desejado para a imagem no Cloudinary.
 * @returns {Promise<string>} A URL segura da imagem no Cloudinary.
 */
export async function uploadArquivoCloudinary(file, publicFilename) {
    // IMPORTANTE: Substitua com suas credenciais do Cloudinary
    const CLOUD_NAME = "sistemaEtec";
    const UPLOAD_PRESET = "Sistema";
    
    const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);
    formData.append("public_id", publicFilename);

    try {
        const response = await fetch(url, {
            method: "POST",
            body: formData,
        });
        if (!response.ok) {
            throw new Error('Falha no upload para o Cloudinary');
        }
        const data = await response.json();
        console.log('Upload para Cloudinary bem-sucedido:', data.secure_url);
        return data.secure_url;
    } catch (error) {
        console.error("Erro no upload para o Cloudinary: ", error);
        throw error;
    }
}
