"use server";
import crypto from 'crypto';

const ITTYBIT_API_KEY = "ittybit_59aksh56JcorgbMLEqYmetIAwvTPCzsvLorXcadRKoAbmKWQ";
const API_URL = "https://api.ittybit.dev";
const DOMAIN = "host-video.ittybitdev.net";

const getRequest = ({ endpoint }: { endpoint: string }) => {

    return fetch(`${API_URL}${endpoint}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${ITTYBIT_API_KEY}`,
            "Content-Type": "application/json"
        }
    }).then(res => res.json());

}

import { IttybitRequestBody, IttybitTask } from '../types/ittybit';

const postRequest = ({ endpoint, body }: { endpoint: string, body: IttybitRequestBody }) => {

    return fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${ITTYBIT_API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    }).then(res => res.json());

}

function generateSignature({ string }: { string: string }) {
  const hmac = crypto.createHmac('sha256', ITTYBIT_API_KEY);
  hmac.update(string);
  const base64 = hmac.digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return base64;
}

export async function createSignedUrl({ path, method = "GET" }: { path: string, method?: string }) {
  try {
    const expiry = Math.floor(Date.now() / 1000) + 60 * 60; // 1 hour from now
    const string = `${path}?expiry=${expiry}&method=${method.toLowerCase()}`;
    const signature = generateSignature({ string });
    const signedUrl = `https://${DOMAIN}/${string}&signature=${signature}`;
    return signedUrl;
  } catch (error) {
    // handle the error
    console.log(error)
  }
}

export async function getFile({ fileId }: { fileId: string }) {
    return getRequest({ endpoint: `/files/${fileId}` });
}


export async function createTasksForVideo({ videoReference, fileId }: { videoReference: string, fileId: string }) {

    const webhookUrl = `https://ucvaingacnnatzscfhxr.supabase.co/functions/v1/ittybit-new-file-webhook`

    const tasks = [
        {
            "kind": "video",
            "file_id": fileId,
        }, {
            "kind": "image",
            "start": 1,
            "file_id": fileId,
        }, {
            "kind": "thumbnails",
            "file_id": fileId,
        }, {
            "kind": "subtitles",
            "file_id": fileId,           
        }, {
            "kind": "outline",
            "file_id": fileId,
        }, {
            "kind": "speech",
            "file_id": fileId,
        }, {
            "kind": "chapters",
            "file_id": fileId,
        }, {
            "kind": "description",
            "file_id": fileId,
        }
    ];

    const finishedTasks = [];

    for(let t of tasks) {
        const task = await postRequest({ endpoint: `/tasks`, body: { ...t, webhook_url: `${webhookUrl}?kind=${t.kind}&ref=${videoReference}` } });
        finishedTasks.push(task);
    }
    
    for(let t of finishedTasks) {
        await postRequest({ endpoint: `/tasks/${t.id}/start`, body: {} });
    }
    return true;
}