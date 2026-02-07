export const mapCMS = (cms) => {
   return {
      info: cms.info ? mapInfo(cms.info) : null,
      menu: cms.menu ? mapMenu(cms.menu) : null,
      reviews: cms.reviews ? mapReviews(cms.reviews) : null
   }
}

//* titulo, descripcion, logo, telefono, contacto, [botones{valor, url}], socials[{valor, url}]
const mapInfo = (infoRaw: any[]) => {
   // 🔵 agrupar por clave
   const grouped = infoRaw.reduce((acc: Record<string, any[]>, row) => {
      if (!row?.clave) return acc;

      if (!acc[row.clave]) {
         acc[row.clave] = [];
      }

      acc[row.clave].push({
         valor: row.valor ?? "",
         url: row.url ?? "",
      });

      return acc;
   }, {});

   // 🔵 helpers
   const getSingle = (key: string) => grouped[key]?.[0]?.valor ?? "";

   const getList = (key: string) => grouped[key] ?? [];

   // 🔵 resultado final limpio
   return {
      titulo: getSingle("titulo"),
      descripcion: getSingle("descripcion"),
      logo: getSingle("logo"),
      direccion: getSingle("direccion"),
      telefono: getSingle("telefono"),

      botones: getList("boton"),
      socials: getList("social"),
   };
}

//* [menu{categoia, nombre, descripcion, precio, imagen, activo}]
const mapMenu = (menuRaw: any[]) => {
   return menuRaw
      .filter((row) => row.nombre) // evita filas vacías
      .map((row) => ({
         categoria: row.categoria?.trim() || "Sin categoría",

         nombre: row.nombre?.trim() || "",

         descripcion: row.descripcion?.trim() || "",

         precio: Number(row.precio) || 0,

         imagen: row.imagen?.trim() || "",

         activo: Boolean(row.activo && String(row.activo).trim() !== ""),
      }));
}

// * meta{total, promedio}, [reseña{nombre, fecha, puntuacion, perfil, texto, referencia}]
const mapReviews = (reviewsRaw: any[]) => {


   return reviewsRaw.reduce(
      (acc, row) => {
         const tipo = String(row.tipo || "").toLowerCase();

         if (tipo === "meta" && row.clave) {
            
               acc.meta[row.clave] = isNaN(row.valor)
                  ? row.valor
                  : Number(row.valor);
         }

         if (tipo === "review") {
               acc.reviews.push({
                  authorName: row.authorName || "",
                  publishTime: row.publishTime || "",
                  rating: Number(row.rating) || 0,
                  text: row.text || "",
                  authorPhoto: row.authorPhoto || null,
                  referencia: row.referencia || null,
               });
         }

         return acc;
      },
      { meta: {}, reviews: [] },
   );
}
