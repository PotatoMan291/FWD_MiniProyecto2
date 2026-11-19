export function cosine(a, b) {
  if (a.length !== b.length || !a.length) return -1;
  let dot = 0,
    aa = 0,
    bb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    aa += a[i] ** 2;
    bb += b[i] ** 2;
  }
  return aa && bb ? dot / Math.sqrt(aa * bb) : -1;
}

export function chunk(text) {
  let section = "General",
    buf = "",
    out = [];
  const flush = () => {
    if (buf.trim()) out.push({ seccion: section, contenido: buf.trim() });
    buf = "";
  };
  for (const line of text.replace(/\r/g, "").split("\n")) {
    if (/^(SECCIÓN\s*:|\s*\d+\.\s+)/i.test(line)) {
      flush();
      section = line
        .replace(/^(SECCIÓN\s*:|\s*\d+\.\s+)/i, "")
        .trim()
        .slice(0, 255);
      continue;
    }
    for (const part of line.match(/.{1,1800}/g) || []) {
      if (buf.length + part.length > 2400) {
        const tail = buf.slice(-250);
        flush();
        buf = tail + "\n";
      }
      buf += part + "\n";
    }
  }
  flush();
  return out;
}

function normalize(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function expandQuery(pregunta) {
  let query = normalize(pregunta);

  if (/casa|remoto|distancia|teletrabajo/.test(query)) {
    query += " teletrabajo modalidad remota";
  }

  if (
    /enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre/.test(
      query,
    )
  ) {
    query += " calendario feriados";
  }

  if (/casar|boda|matrimonio/.test(query)) {
    query += " permiso matrimonio licencia";
  }

  return query;
}

export function rank(rows, v, threshold = 0.3, k = 5, pregunta = "") {
  const keywords = [
    ...new Set(
      expandQuery(pregunta)
        .split(/\W+/)
        .filter((word) => word.length > 3),
    ),
  ];

  return rows
    .map((r) => {
      const embedding =
        typeof r.embedding === "string" ? JSON.parse(r.embedding) : r.embedding;

      const semantic = cosine(v, embedding);

      const content = normalize(
        `${r.nombre || ""} ${r.seccion || ""} ${r.contenido || ""}`,
      );

      const matches = keywords.filter((word) => content.includes(word)).length;

      const lexical = keywords.length ? matches / keywords.length : 0;

      const score = semantic * 0.7 + lexical * 0.3;

      return { ...r, score, semantic, lexical };
    })
    .filter((r) => r.semantic >= threshold || r.lexical >= 0.4)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}
