// @ts-check
import { defineConfig } from "astro/config";
import { loadEnv } from "vite";
import tailwindcss from "@tailwindcss/vite";

const env = loadEnv(process.env.NODE_ENV, process.cwd(), "");
let site = "";
env.SITE ? site = env.SITE : site = `https://${env.NAME_ID}.vercel.app/`;

const config = {
	site: site,
	vite: {
		plugins: [tailwindcss()],
	},
}


// https://astro.build/config
export default defineConfig(config);
