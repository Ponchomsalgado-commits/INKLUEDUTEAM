// Tema de color del lienzo (clases .tema-* de editor.css) según el skin de la plantilla; skins desconocidos usan rana
const TEMA_POR_SKIN = { rana_nenufar: "rana", mariposa_flor: "mariposa" };

export const temaDeSkin = (skin) => TEMA_POR_SKIN[skin] ?? "rana";
