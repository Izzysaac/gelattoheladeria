export async function loadSheet(hoja) {
    // const sheetId = process.env.GOOGLE_SHEET_ID;
    const sheetId = import.meta.env.GOOGLE_SHEET_ID;
    const restaurantId = import.meta.env.RESTAURANT_ID;

    const url = `https://opensheet.elk.sh/${sheetId}/${restaurantId}-${hoja}`;

    const res = await fetch(url);

    console.log(res);

    if (!res.ok) throw new Error("Sheet fetch failed");

    const data = await res.json();

    return data;

    //   const grouped = data.reduce((acc, item) => {
    //         if (!acc[item.clave]) {
    //             acc[item.clave] = [];
    //         }
    //         acc[item.clave].push(item);
    //         return acc;
    //     }, {});

    //     return {
    //         titulo: grouped.titulo?.[0]?.valor ?? "",
    //         descripcion: grouped.descripcion?.[0]?.valor ?? "",
    //         logo: grouped.logo?.[0]?.valor ?? "",
    //         botones: grouped.boton ?? [],
    //         socials: grouped.social ?? [],
    //     };
}
