export interface Product {
  id: number;
  category: string;
  name: string;
  price: number;
  image: string;
  images?: string[];
  description: string;
  sizes: string[];
  availableAs: ("tee" | "tank")[];
  isNewArrival?: boolean;
}

export const newArrivalIds = [23];

export const products: Product[] = [
  {
    id: 1, category: "beaded tee", name: "Blue Fish", price: 4000,
    image: "/images/products/blue fish.png",
    description: "Hand embroidered blue beaded fish. Composition: 100% lightweight cotton.",
    sizes: ["S", "M", "L", "XL"],
    availableAs: ["tee", "tank"],
  },
  {
    id: 2, category: "beaded tee", name: "Blue Turtle", price: 4500,
    image: "/images/products/blue turtle.png",
    description: "Hand embroidered blue and green turtle. Composition: 100% lightweight cotton.",
    sizes: ["S", "M", "L", "XL"],
    availableAs: ["tee", "tank"],
  },
  {
    id: 3, category: "beaded tee", name: "Cherry", price: 4000,
    image: "/images/products/cherry.png",
    description: "Hand embroidered cherry. Composition: 100% lightweight cotton.",
    sizes: ["S", "M", "L", "XL"],
    availableAs: ["tee", "tank"],
  },
  {
    id: 4, category: "beaded tee", name: "Cinnamon Roll", price: 5000,
    image: "/images/products/cinnamon roll.png",
    description: "Hand embroidered cinnamon roll. Composition: 100% lightweight cotton.",
    sizes: ["S", "M", "L", "XL"],
    availableAs: ["tee", "tank"],
  },
  {
    id: 5, category: "beaded tee", name: "Evil Eye", price: 4000,
    image: "/images/products/evil eye.png",
    description: "Hand embroidered evil eye. Composition: 100% lightweight cotton.",
    sizes: ["S", "M", "L", "XL"],
    availableAs: ["tee", "tank"],
  },
  {
    id: 6, category: "beaded tee", name: "F1 Ferrari", price: 5000,
    image: "/images/products/F1 ferrari.png",
    description: "Hand embroidered F1 Ferrari car. Composition: 100% lightweight cotton.",
    sizes: ["S", "M", "L", "XL"],
    availableAs: ["tee", "tank"],
  },
  {
    id: 7, category: "beaded tee", name: "F1 Redbull", price: 5000,
    image: "/images/products/F1 redbull.png",
    description: "Hand embroidered F1 Redbull car. Composition: 100% lightweight cotton.",
    sizes: ["S", "M", "L", "XL"],
    availableAs: ["tee", "tank"],
  },
  {
    id: 8, category: "beaded tee", name: "Flamingo", price: 4000,
    image: "/images/products/flamingo.png",
    description: "Hand embroidered flamingo. Composition: 100% lightweight cotton.",
    sizes: ["S", "M", "L", "XL"],
    availableAs: ["tee", "tank"],
  },
  {
    id: 9, category: "beaded tee", name: "Olives", price: 4000,
    image: "/images/products/olive.png",
    description: "Hand embroidered olives. Composition: 100% lightweight cotton.",
    sizes: ["S", "M", "L", "XL"],
    availableAs: ["tee", "tank"],
  },
  {
    id: 10, category: "beaded tee", name: "Padel", price: 4000,
    image: "/images/products/padel.png",
    description: "Hand embroidered padel rackets & ball. Composition: 100% lightweight cotton.",
    sizes: ["S", "M", "L", "XL"],
    availableAs: ["tee", "tank"],
  },
  {
    id: 11, category: "beaded tee", name: "Pink Palmtree", price: 4500,
    image: "/images/products/pink palmtree.png",
    description: "Hand embroidered palmtree with pearls. Composition: 100% lightweight cotton.",
    sizes: ["S", "M", "L", "XL"],
    availableAs: ["tee", "tank"],
  },
  {
    id: 12, category: "beaded tee", name: "Rainbow Fish", price: 4500,
    image: "/images/products/rainbow fish.png",
    description: "Hand embroidered rainbow fish. Composition: 100% lightweight cotton.",
    sizes: ["S", "M", "L", "XL"],
    availableAs: ["tee", "tank"],
  },
  {
    id: 13, category: "beaded tee", name: "Red Car", price: 5500,
    image: "/images/products/red car.png",
    description: "Hand embroidered red car. Composition: 100% lightweight cotton.",
    sizes: ["S", "M", "L", "XL"],
    availableAs: ["tee", "tank"],
  },
  {
    id: 14, category: "beaded tee", name: "Red Lobster", price: 5000,
    image: "/images/products/red lobster.png",
    description: "Hand embroidered red lobster. Composition: 100% lightweight cotton.",
    sizes: ["S", "M", "L", "XL"],
    availableAs: ["tee", "tank"],
  },
  {
    id: 15, category: "beaded tee", name: "Seahorse", price: 4500,
    image: "/images/products/seahorse.png",
    description: "Hand embroidered blue seahorse with pearls. Composition: 100% lightweight cotton.",
    sizes: ["S", "M", "L", "XL"],
    availableAs: ["tee", "tank"],
  },
  {
    id: 16, category: "beaded tee", name: "Strawberry", price: 4000,
    image: "/images/products/strawberry.png",
    description: "Hand embroidered strawberry. Composition: 100% lightweight cotton.",
    sizes: ["S", "M", "L", "XL"],
    availableAs: ["tee", "tank"],
  },
  {
    id: 17, category: "beaded tee", name: "Swan", price: 4500,
    image: "/images/products/swan.png",
    description: "Hand embroidered swan with pearls. Composition: 100% lightweight cotton.",
    sizes: ["S", "M", "L", "XL"],
    availableAs: ["tee", "tank"],
  },
  {
    id: 18, category: "beaded tee", name: "Turtle", price: 4000,
    image: "/images/products/turtle.png",
    description: "Hand embroidered turtle. Composition: 100% lightweight cotton.",
    sizes: ["S", "M", "L", "XL"],
    availableAs: ["tee", "tank"],
  },
  {
    id: 19, category: "beaded tank", name: "Beachy", price: 4000,
    image: "/images/products/beachy tank.png",
    description: "Hand embroidered crab, seashell, and starfish. Composition: 95% cotton, 5% spandex.",
    sizes: ["S", "M", "L"],
    availableAs: ["tee", "tank"],
  },
  {
    id: 20, category: "beaded tank", name: "Cherry Bow", price: 4000,
    image: "/images/products/cherry bow.png",
    description: "Hand embroidered cherry. Composition: 95% cotton, 5% spandex.",
    sizes: ["S", "M", "L"],
    availableAs: ["tee", "tank"],
  },
  {
    id: 21, category: "beaded tank", name: "Duo Fish", price: 4500,
    image: "/images/products/duo fish.png",
    description: "Hand embroidered fish in red and blue. Composition: 95% cotton, 5% spandex.",
    sizes: ["S", "M", "L"],
    availableAs: ["tee", "tank"],
  },
  {
    id: 22, category: "beaded tank", name: "XOXO", price: 4000,
    image: "/images/products/xoxo.png",
    description: "Hand embroidered red lips. Composition: 95% cotton, 5% spandex.",
    sizes: ["S", "M", "L"],
    availableAs: ["tee", "tank"],
  },
  {
    id: 23, category: "beaded tee", name: "Besties", price: 4000,
    image: "/images/products/besties.jpeg",
    images: ["/images/products/besties.jpeg", "/images/products/besties2.jpeg"],
    description: "Hand embroidered besties hearts. Composition: 95% cotton, 5% spandex.",
    sizes: ["S", "M", "L", "XL"],
    availableAs: ["tee", "tank"],
    isNewArrival: true,
  },
];