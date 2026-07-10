import { Buffer } from "node:buffer";
import type { IncomingMessage, ServerResponse } from "node:http";
import { config } from "dotenv";
import OpenAI, { toFile } from "openai";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

config({ path: ".env.local", override: true });
config();

const MAX_IMAGE_PAYLOAD_SIZE = 24 * 1024 * 1024;

function gptImageTransformApi(): Plugin {
  return {
    name: "gpt-image-transform-api",
    configureServer(server) {
      server.middlewares.use("/api/transform-photo", async (request, response) => {
        if (request.method !== "POST") {
          sendJson(response, 405, { error: "Méthode non autorisée." });
          return;
        }

        try {
          const apiKey = process.env.OPENAI_API_KEY;

          if (!apiKey) {
            sendJson(response, 500, {
              error: "Ajoute OPENAI_API_KEY dans .env.local puis redémarre le serveur.",
            });
            return;
          }

          const body = await readJsonBody(request);
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
            model: process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1",
            image: await toFile(imageBuffer, `sonia-photo.${extension}`, { type: mimeType }),
            prompt:
              "Transforme la photo fournie en souvenir joyeux pour une carte de retraite. " +
              "Garde la personne reconnaissable et conserve la photo comme élément central. " +
              "Ne rajoute pas d'oreilles, de cornes, de costume ou de transformation du visage. " +
              "Place l'ensemble dans une composition propre et festive inspirée d'un emballage rond de fromage, rouge, crème, bleu et doré, avec étoiles et rubans. " +
              "Ajoute seulement le texte lisible 'Sonia qui rit' de façon élégante et bien intégrée. " +
              "Ne copie pas de logo réel et n'utilise pas de marque déposée.",
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
      });
    },
  };
}

function readJsonBody(request: IncomingMessage) {
  return new Promise<{ image?: unknown }>((resolve, reject) => {
    let body = "";

    request.on("data", (chunk: Buffer) => {
      body += chunk.toString("utf8");

      if (body.length > MAX_IMAGE_PAYLOAD_SIZE) {
        request.destroy(new Error("Image trop lourde."));
      }
    });

    request.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("JSON invalide."));
      }
    });

    request.on("error", reject);
  });
}

function sendJson(response: ServerResponse, status: number, payload: unknown) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
}

export default defineConfig({
  plugins: [gptImageTransformApi(), react()],
});
