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


/**
 * [INSEGURO EM PRODUÇÃO] Deleta um arquivo do Cloudinary diretamente do front-end.
 * AVISO DE SEGURANÇA: Esta implementação expõe sua API Secret no código do cliente,
 * o que é um risco de segurança grave.
 * @param {string} publicId - O public_id do arquivo a ser deletado no Cloudinary.
 * @returns {Promise<object>} A resposta da API do Cloudinary.
 */
export async function deleteArquivoCloudinary(publicId) {
    // Suas credenciais do Cloudinary
    const CLOUD_NAME = "sistemaetec";
    const API_KEY = "214275152256267";
    const API_SECRET = "bN2TBUrEIFgAyrPJ3j1p8DM6o1Q";

    // 1. Preparar os dados para a assinatura
    const timestamp = Math.round((new Date()).getTime() / 1000);
    const stringToSign = `public_id=${publicId}&timestamp=${timestamp}${API_SECRET}`;

    // 2. Gerar a assinatura SHA-1 usando a Web Crypto API do navegador
    const encoder = new TextEncoder();
    const data = encoder.encode(stringToSign);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // 3. Preparar a requisição para a API do Cloudinary
    const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/destroy`;
    const formData = new FormData();
    formData.append("public_id", publicId);
    formData.append("timestamp", timestamp);
    formData.append("api_key", API_KEY);
    formData.append("signature", signature);

    // 4. Enviar a requisição
    try {
        const response = await fetch(url, {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error.message || 'Falha ao deletar a imagem no Cloudinary.');
        }

        const result = await response.json();
        console.log(`Arquivo com public_id ${publicId} deletado com sucesso do Cloudinary.`, result);
        return result;
    } catch (error) {
        console.error("Erro ao deletar arquivo do Cloudinary:", error);
        alert("ERRO: Não foi possível deletar a imagem do servidor. A avaliação será removida do sistema, mas o arquivo de imagem pode permanecer no armazenamento.");
        throw error;
    }
}