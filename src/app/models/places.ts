export interface Place {
    name: string;
    tags: string[];
    link?: string;
}

const places: Place[] = [
    {
        name: 'Oud Coffee Co.',
        tags: ['coffee', 'cocktails'],
        link: 'https://www.instagram.com/oudcoffeeco/'
    },
    {
        name: 'Daily Food & Wine',
        tags: ['luxury', 'restaurant', 'food', 'breakfast', 'juices', 'dessert']
    },
    {
        name: 'Bristot',
        tags: ['coffee']
    },
    {
        name: 'Matto Napoletano',
        tags: ['luxury', 'food', 'pizza']
    },
    {
        name: 'The Dude',
        tags: ['chill', 'coffee', 'specialty']
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
        tags: ['luxury', 'restaurant', 'food', 'salad', 'pizza']
    },
    {
        name: 'Drip',
        tags: ['coffee', 'specialty']
    },
    {
        name: 'ChocoHouse',
        tags: ['juices', 'pancake', 'dessert']
    },
    {
        name: 'Aloha',
        tags: ['cocktails']
    },
    {
        name: 'Oriental Bahce',
        tags: ['chill', 'coffee', 'dessert']
    },
    {
        name: 'Balkan Tantuni',
        tags: ['food', 'cigKofte']
    },
    {
        name: 'Metanoja',
        tags: ['coffee', 'work']
    },
    {
        name: 'MILO Fine Dining',
        tags: ['luxury', 'restaurant', 'food', 'pasta']
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
        tags: ['restaurant', 'food', 'pasta']
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
        tags: ['chill', 'coffee', 'work']
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
        tags: ['food', 'lahmacun']
    },
    {
        name: 'Pcela',
        tags: ['food', 'kebap']
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
        tags: ['restaurant', 'dessert']
    },
    {
        name: 'Chair',
        tags: ['food', 'simitPogaca']
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
        tags: ['food', 'kebap']
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
        tags: ['restaurant', 'food', 'pizza']
    },
    {
        name: 'Kacamak',
        tags: ['restaurant', 'food', 'meats']
    },
    {
        name: 'Engin Cigkofte',
        tags: ['food', 'cigKofte', 'lahmacun']
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
        tags: ['chill', 'coffee', 'dessert']
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
        tags: ['luxury', 'chill', 'restaurant', 'coffee']
    },
    {
        name: 'Bella Vista East Gate',
        tags: ['restaurant', 'pancake', 'dessert']
    },
    {
        name: 'Healthyish Debar Maalo',
        tags: ['breakfast', 'juices']
    },
    {
        name: 'Garden',
        tags: ['restaurant', 'food', 'meats']
    },
    {
        name: 'Mr. Pizza',
        tags: ['food', 'pizza']
    },
    {
        name: 'MOIA',
        tags: ['chill', 'coffee', 'dessert']
    },
    {
        name: 'Healthyish Leptokarija',
        tags: ['breakfast', 'juices']
    },
    {
        name: 'Cafe Ottoman',
        tags: ['chill', 'coffee', 'juices']
    },
    {
        name: 'Coffee Factory Center',
        tags: ['coffee', 'dessert']
    },
    {
        name: 'Sarajeva Steakhouse',
        tags: ['food', 'burger']
    },
    {
        name: 'Cafe Sach',
        tags: ['coffee']
    },
    {
        name: 'Destan East Gate',
        tags: ['food', 'kebap']
    },
    {
        name: 'Levant',
        tags: ['food', 'meats']
    },
    {
        name: 'SushiCo',
        tags: ['luxury', 'restaurant', 'food', 'sushi']
    },
    {
        name: 'Lokmades',
        tags: ['dessert']
    },
    {
        name: 'Destan Bunjakovec',
        tags: ['food', 'kebap']
    },
    {
        name: 'Saraevo',
        tags: ['food', 'corba', 'kebap']
    },
    {
        name: 'Teteks Carsija',
        tags: ['food', 'burger']
    },
    {
        name: 'Mulliri',
        tags: ['coffee', 'dessert']
    },
    {
        name: 'Anatolia',
        tags: ['food', 'lahmacun', 'icliKofte']
    },
    {
        name: 'Fish Restaurant',
        tags: ['restaurant', 'food', 'fish']
    },
    {
        name: 'Caffe Izzi',
        tags: ['coffee']
    },
    {
        name: 'Miracoli',
        tags: ['restaurant', 'food', 'salad', 'meats']
    },
    {
        name: 'ChaCha',
        tags: ['restaurant', 'food', 'pasta', 'meats']
    }
];

export default places;