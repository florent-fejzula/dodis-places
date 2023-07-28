export interface Place {
    name: string;
    tags: string[];
    link?: string;
}

/*
Available tags:
luxury, coffee, specialty, work, croissant, breakfast, corba, bread,
salad, juices, cocktails, dessert, iceCream, baklava, pancake,
food, kebap, burger, fish, pasta, pizza, sandwich
*/

const places: Place[] = [
    {
        name: 'Oud Coffee Co.',
        tags: ['coffee', 'cocktails'],
        link: 'https://www.instagram.com/oudcoffeeco/'
    },
    {
        name: 'Daily Food & Wine',
        tags: ['breakfast', 'food', 'luxury']
    },
    {
        name: 'Bristot',
        tags: ['coffee']
    },
    {
        name: 'Matto Napoletano',
        tags: ['pizza', 'luxury']
    },
    {
        name: 'The Dude',
        tags: ['coffee', 'specialty']
    },
    {
        name: 'Spizzicotto',
        tags: ['breakfast', 'sandwich']
    },
    {
        name: 'Teeny Tajni',
        tags: ['breakfast', 'juices']
    },
    {
        name: 'Lipa',
        tags: ['coffee', 'croissant']
    },
    {
        name: 'Mapo City',
        tags: ['coffee']
    },
    {
        name: 'Distrikt',
        tags: ['luxury', 'salad', 'pizza']
    },
    {
        name: 'Drip',
        tags: ['coffee', 'specialty']
    },
    {
        name: 'ChocoHouse',
        tags: ['coffee', 'juices', 'pancake', 'dessert']
    },
    {
        name: 'Aloha',
        tags: ['cocktails']
    },
    {
        name: 'Oriental Bahce',
        tags: ['coffee', 'dessert']
    },
    {
        name: 'Balkan Tantuni',
        tags: ['food']
    },
    {
        name: 'Metanoja',
        tags: ['coffee', 'work']
    },
    {
        name: 'MILO Fine Dining',
        tags: ['luxury', 'pasta']
    },
    {
        name: 'Dabov',
        tags: ['coffee', 'specialty']
    },
    {
        name: 'Eskimo',
        tags: ['iceCream']
    },
    {
        name: 'La Terrazza',
        tags: ['pasta']
    },
    {
        name: 'Zentral',
        tags: ['coffee', 'work']
    },
    {
        name: 'Joy Center',
        tags: ['coffee', 'croissant']
    },
    {
        name: 'Mikel',
        tags: ['coffee', 'work']
    },
    {
        name: 'Joy Karposh',
        tags: ['coffee', 'croissant', 'work']
    },
    {
        name: 'Stela',
        tags: ['dessert']
    },
    {
        name: 'Cedeno Medeno Ledeno',
        tags: ['breakfast', 'juices']
    },
    {
        name: 'Angela Merkel',
        tags: ['baklava']
    },
    {
        name: 'Mati',
        tags: ['food']
    },
    {
        name: 'Pcela',
        tags: ['kebap']
    },
    {
        name: 'Sugar Cube Corner',
        tags: ['coffee', 'pancake']
    },
    {
        name: 'Joy Kapistec',
        tags: ['coffee', 'croissant', 'work', 'bread']
    },
    {
        name: 'Oselot',
        tags: ['dessert']
    },
    {
        name: 'Chair',
        tags: ['food']
    },
    {
        name: 'Sweet Look',
        tags: ['iceCream']
    },
    {
        name: 'Mon Frere',
        tags: ['coffee', 'cocktails']
    },
    {
        name: 'Teff Bakery',
        tags: ['breakfast', 'croissant']
    },
    {
        name: 'World of Coffee',
        tags: ['coffee', 'specialty']
    },
    {
        name: 'Destan',
        tags: ['kebap']
    },
    {
        name: 'Breadway',
        tags: ['coffee', 'breakfast']
    },
    {
        name: 'Silbo',
        tags: ['croissant', 'bread']
    },
    {
        name: 'Gino',
        tags: ['pizza']
    },
    {
        name: 'Kacamak',
        tags: ['food']
    },
    {
        name: 'Engin Cigkofte',
        tags: ['food']
    },
    {
        name: 'Vero',
        tags: ['croissant', 'bread']
    },
    {
        name: 'Coffee Factory Debar Maalo',
        tags: ['coffee', 'dessert']
    },
    {
        name: 'Balat',
        tags: ['coffee', 'baklava', 'cocktails']
    },
    {
        name: 'Ristretto',
        tags: ['coffee', 'specialty']
    },
    {
        name: 'L\'angolo Di Caffe',
        tags: ['coffee', 'dessert']
    },
    {
        name: 'Pastel',
        tags: ['croissant']
    },
    {
        name: 'Bottega del Gusto',
        tags: ['pasta']
    },
    {
        name: 'Four',
        tags: ['luxury', 'coffee']
    },
    {
        name: 'Bella Vista East Gate',
        tags: ['coffee', 'pancake', 'dessert']
    },
    {
        name: 'Healthyish Debar Maalo',
        tags: ['breakfast', 'juices']
    },
    {
        name: 'Garden',
        tags: ['food']
    },
    {
        name: 'Mr. Pizza',
        tags: ['pizza']
    },
    {
        name: 'MOIA',
        tags: ['coffee', 'dessert']
    },
    {
        name: 'Healthyish Leptokarija',
        tags: ['breakfast', 'juices']
    },
    {
        name: 'Cafe Ottoman',
        tags: ['coffee', 'juices']
    },
    {
        name: 'Coffee Factory Center',
        tags: ['coffee', 'dessert']
    },
    {
        name: 'Sarajeva Steakhouse',
        tags: ['burger']
    },
    {
        name: 'Cafe Sach',
        tags: ['coffee']
    },
    {
        name: 'Destan East Gate',
        tags: ['kebap']
    },
    {
        name: 'Levant',
        tags: ['food']
    },
    {
        name: 'SushiCo',
        tags: ['luxury', 'food']
    },
    {
        name: 'Lokmades',
        tags: ['dessert']
    },
    {
        name: 'Destan Bunjakovec',
        tags: ['kebap']
    },
    {
        name: 'Saraevo',
        tags: ['corba', 'kebap']
    },
    {
        name: 'Teteks Carsija',
        tags: ['burger']
    },
    {
        name: 'Mulliri',
        tags: ['coffee', 'dessert']
    },
    {
        name: 'Anatolia',
        tags: ['food']
    },
    {
        name: 'Fish Restaurant',
        tags: ['food', 'fish']
    },
    {
        name: 'Caffe Izzi',
        tags: ['coffee']
    },
    {
        name: 'La Puerta',
        tags: ['food']
    },
    {
        name: 'Miracoli',
        tags: ['food']
    },
    {
        name: 'ChaCha',
        tags: ['food', 'pasta']
    }
];

export default places;