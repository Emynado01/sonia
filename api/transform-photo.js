import OpenAI, { toFile } from "openai";

const MAX_IMAGE_PAYLOAD_SIZE = 24 * 1024 * 1024;

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "25mb",
    },
  },
};

export default async function handler(request, response) {
  if (request.method !== "POST") {
    sendJson(response, 405, { error: "Méthode non autorisée." });
    return;
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      sendJson(response, 500, {
        error: "OPENAI_API_KEY manque dans les variables d’environnement du déploiement.",
      });
      return;
    }

    const body = await getRequestBody(request);
    const image = typeof body.image === "string" ? body.image : "";
    const imageMatch = image.match(/^data:(image\/(?:png|jpeg|jpg|webp));base64,(.+)$/);

    if (!imageMatch) {
      sendJson(response, 400, { error: "Photo invalide ou absente." });
      return;
    }

    const mimeType = imageMatch[1] === "image/jpg" ? "image/jpeg" : imageMatch[1];
    const extension = mimeType.split("/")[1];
    const imageBuffer = Buffer.from(imageMatch[2], "base64");

    const client = new OpenAI({ apiKey });
    const editedImage = await client.images.edit({
      model: "gpt-image-2",
      image: await toFile(imageBuffer, `sonia-photo.${extension}`, { type: mimeType }),
      prompt:
        "Transforme la photo fournie en illustration de style dessin réaliste, proche d'une vraie photo et clairement ressemblante à la personne originale. " +
        "Respecte l'expression naturelle de la personne: ne crée pas de sourire si la photo d'origine ne sourit pas, ne change pas l'âge, le visage, la posture ou l'identité. " +
        "Intègre le portrait dans un emballage rond de fromage inspiré de l'univers La Vache qui rit: couleurs rouge, crème, bleu et doré, contour circulaire et composition propre. " +
        "Ajoute uniquement la phrase lisible 'Sonia qui rit' comme titre principal, avec quelques décorations élégantes et légères. " +
        "N'ajoute pas d'oreilles, de cornes, de costume, de logo réel, de marque déposée exacte ni le nom officiel de la marque.",
      size: "1024x1024",
    });

    const result = editedImage.data?.[0]?.b64_json;

    if (!result) {
      sendJson(response, 502, { error: "GPT Image n’a pas renvoyé d’image." });
      return;
    }

    sendJson(response, 200, { image: `data:image/png;base64,${result}` });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue.";
    sendJson(response, 500, { error: `GPT Image a refusé ou échoué: ${message}` });
  }
}

async function getRequestBody(request) {
  if (request.body && typeof request.body === "object" && !isReadableStream(request.body)) {
    return request.body;
  }

  const rawBody = await readRawBody(request);

  try {
    return JSON.parse(rawBody);
  } catch {
    throw new Error("JSON invalide.");
  }
}

function readRawBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk.toString("utf8");

      if (body.length > MAX_IMAGE_PAYLOAD_SIZE) {
        reject(new Error("Image trop lourde."));
        request.destroy();
      }
    });

    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

function isReadableStream(value) {
  return value && typeof value.on === "function";
}

function sendJson(response, status, payload) {
  response.status(status).json(payload);
}
