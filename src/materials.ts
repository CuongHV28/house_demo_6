import { DoubleSide, MeshLambertMaterial, MeshNormalMaterial, MeshPhongMaterial, MeshStandardMaterial } from "three";

const colors = {
    ground: 0x333333,
    pavement: 0x999999,
    background: 0xffffff,
    // background: 0x000000,
    wall: 0xff9999, //0xf4e4d5,
    window: 0x333333,
    alu: 0x111111,
    white: 0xffffff,
    awening: 0x0000ff,
    wood: 0xffffff,
    floor: 0x864427,
    roof: 0x330000,
    green: 0x008833
};

const normalMaterial = new MeshNormalMaterial();
const standartMaterial = new MeshStandardMaterial({ color: 0x666666 });
const lambert = new MeshLambertMaterial({ color: "#fff" });
const phongMaterial = new MeshPhongMaterial({ color: 0x0908ef });

let groundMaterial = new MeshStandardMaterial({
    color: colors.ground,
    transparent: true,
    opacity: 0.5,
});

let floorMaterial = new MeshLambertMaterial({
    color: colors.floor,
    side: DoubleSide
});

let roofMaterial = new MeshLambertMaterial({
    color: colors.roof,
    side: DoubleSide
});
let windowMaterial = new MeshStandardMaterial({ color: colors.window });

let wallMaterial = new MeshLambertMaterial({
    color: colors.wall,
    side: DoubleSide
});

let woodMaterial = new MeshStandardMaterial({
    color: colors.wood,
    metalness: 0,
    roughness: 0.5
});


export { colors, groundMaterial, floorMaterial, roofMaterial, windowMaterial, wallMaterial, woodMaterial, normalMaterial, standartMaterial, lambert, phongMaterial };