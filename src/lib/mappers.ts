/* 
{
   titulo: "Restaurante Mandioka",
   logo: "url_logo.png",
   botones: ["Reservar", "Ver menú"],
   socials: ["instagram.com/xxx", "facebook.com/xxx"]
}  
*/

export function mapInfo(infoRaw: any[]) {
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

/*
   {
      categoria: "Hamburguesas",
      nombre: "Pollo Crispy",
      descripcion: "Con papas",
      precio: 25000,
      imagen: "pollo.jpg",
      activo: true/false
   }
*/

export function mapMenu(menuRaw: any[]) {
   return menuRaw
      .filter((row) => row.nombre) // evita filas vacías
      .map((row) => ({
         categoria: row.categoria?.trim() || "Sin categoría",

         nombre: row.nombre?.trim() || "",

         descripcion: row.descripcion?.trim() || "",

         precio: Number(row.precio) || 0,

         imagen: row.imagen?.trim() || "",

         // ✅ activo según contenido de la celda
         activo: Boolean(row.activo && String(row.activo).trim() !== ""),
      }));
}
