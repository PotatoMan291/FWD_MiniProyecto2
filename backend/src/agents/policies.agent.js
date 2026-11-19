import { readFileSync } from "node:fs";
import { embed, complete } from "../services/ai.js";
import { rank, expandQuery } from "../services/retrieval.js";
import * as model from "../models/rag.model.js";

const prompt = readFileSync(
  new URL("../prompts/policies.txt", import.meta.url),
  "utf8",
);

const fallback = () => ({
  respuesta:
    "No encontré evidencia suficiente en las políticas. Puedes contactar a Recursos Humanos para revisar tu consulta.",
  agente: "politicas",
  escalada: true,
  citas: [],
});

export async function answerPolicy(pregunta, userId) {
  const start = Date.now();

  const query = expandQuery(pregunta);
  const v = await embed(query, true);

  const found = rank(
    await model.rows(),
    v,
    Number(process.env.RAG_THRESHOLD || 0.3),
    5,
    pregunta,
  );

  console.log("Pregunta:", pregunta);

  console.table(
    found.map((f) => ({
      documento: f.nombre,
      seccion: f.seccion,
      similitud: f.semantic.toFixed(3),
      palabras: f.lexical.toFixed(3),
      puntuacion: f.score.toFixed(3),
    })),
  );

  let result = fallback();
  let used = [];

  if (found.length) {
    const output = await complete([
      {
        role: "system",
        content: prompt,
      },
      {
        role: "user",
        content: JSON.stringify({
          pregunta,
          fragmentos: found.map((f) => ({
            id: f.id,
            documento: f.nombre,
            seccion: f.seccion,
            contenido: f.contenido,
          })),
        }),
      },
    ]);

    const ids = Array.isArray(output.citas) ? output.citas.map(String) : [];

    const cited = found.filter((x) => ids.includes(String(x.id)));

    if (
      typeof output.respuesta === "string" &&
      typeof output.escalada === "boolean" &&
      cited.length &&
      ids.every((id) => cited.some((x) => String(x.id) === id))
    ) {
      used = cited.map((x) => x.id);

      result = {
        respuesta: output.respuesta,
        agente: "politicas",
        escalada: output.escalada,
        citas: cited.map((x) => ({
          documento: x.nombre,
          seccion: x.seccion,
          version: x.version,
          url: x.url,
        })),
      };
    }
  }

  await model.log(userId, pregunta, result, Date.now() - start, used);

  return result;
}
