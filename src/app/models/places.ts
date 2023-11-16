export interface Place {
    name: string;
    tags: string[];
    link?: string;
}

const places: Place[] = [
    {
        name: 'Oud Coffee Co.',
        tags: ['carshi', 'coffee', 'specialty', 'cocktails'],
        link: 'https://www.instagram.com/oudcoffeeco/'
    },
    {
        name: 'Daily Food & Wine',
        tags: ['karposh', 'luxury', 'restaurant', 'food', 'breakfast', 'juices', 'dessert']
    },
    {
        name: 'Bristot',
        tags: ['karposh', 'coffee']
    },
    {
        name: 'Matto Napoletano',
        tags: ['karposh', 'luxury', 'food', 'pizza']
    },
    {
        name: 'The Dude',
        tags: ['karposh', 'chill', 'coffee', 'specialty']
    },
    {
        name: 'Spizzicotto',
        tags: ['aerodrom', 'breakfast', 'sandwich']
    },
    {
        name: 'Teeny Tajni',
        tags: ['karposh', 'breakfast', 'juices']
    },
    {
        name: 'Lipa',
        tags: ['karposh', 'coffee', 'croissant']
    },
    {
        name: 'Mapo City',
        tags: ['aerodrom', 'coffee']
    },
    {
        name: 'Distrikt',
        tags: ['centar', 'luxury', 'restaurant', 'food', 'salad', 'pizza']
    },
    {
        name: 'Drip',
        tags: ['karposh', 'coffee', 'specialty']
    },
    {
        name: 'ChocoHouse',
        tags: ['centar', 'juices', 'pancake', 'dessert']
    },
    {
        name: 'Aloha',
        tags: ['karposh', 'cocktails']
    },
    {
        name: 'Oriental Bahce',
        tags: ['carshi', 'chill', 'coffee', 'dessert']
    },
    {
        name: 'Balkan Tantuni',
        tags: ['cair', 'food', 'cigKofte', 'burger']
    },
    {
        name: 'Metanoja',
        tags: ['centar', 'coffee', 'work']
    },
    {
        name: 'MILO Fine Dining',
        tags: ['karposh', 'luxury', 'restaurant', 'food', 'pasta']
    },
    {
        name: 'Dabov',
        tags: ['karposh', 'coffee', 'specialty']
    },
    {
        name: 'Eskimo',
        tags: ['centar', 'iceCream']
    },
    {
        name: 'La Terrazza',
        tags: ['centar', 'restaurant', 'food', 'pasta']
    },
    {
        name: 'Zentral',
        tags: ['centar', 'coffee', 'work']
    },
    {
        name: 'Joy Center',
        tags: ['centar', 'coffee', 'croissant']
    },
    {
        name: 'Mikel',
        tags: ['karposh', 'chill', 'coffee', 'work']
    },
    {
        name: 'Joy Karposh',
        tags: ['karposh', 'coffee', 'croissant', 'work']
    },
    {
        name: 'Stela',
        tags: ['aerodrom', 'dessert']
    },
    {
        name: 'Cedeno Medeno Ledeno',
        tags: ['aerodrom', 'breakfast', 'juices']
    },
    {
        name: 'Angela Merkel',
        tags: ['carshi', 'baklava']
    },
    {
        name: 'Mati',
        tags: ['carshi', 'food', 'lahmacun']
    },
    {
        name: 'Pcela',
        tags: ['cair', 'food', 'kebap']
    },
    {
        name: 'Sugar Cube Corner',
        tags: ['aerodrom', 'coffee', 'pancake']
    },
    {
        name: 'Joy Kapistec',
        tags: ['karposh', 'coffee', 'croissant', 'work', 'bread']
    },
    {
        name: 'Oselot',
        tags: ['karposh', 'restaurant', 'dessert']
    },
    {
        name: 'Furna Cair',
        tags: ['cair', 'food', 'simitPogaca']
    },
    {
        name: 'Sweet Look',
        tags: ['centar', 'iceCream']
    },
    {
        name: 'Mon Frere',
        tags: ['carshi', 'coffee', 'cocktails']
    },
    {
        name: 'Teff Bakery',
        tags: ['carshi', 'breakfast', 'croissant']
    },
    {
        name: 'World of Coffee',
        tags: ['aerodrom', 'coffee', 'specialty']
    },
    {
        name: 'Destan',
        tags: ['carshi', 'food', 'kebap']
    },
    {
        name: 'Silbo',
        tags: ['karposh', 'croissant', 'bread']
    },
    {
        name: 'Gino',
        tags: ['centar', 'restaurant', 'food', 'pizza', 'dessert', 'fullCake']
    },
    {
        name: 'Kacamak',
        tags: ['carshi', 'restaurant', 'food', 'meats']
    },
    {
        name: 'Engin Cigkofte',
        tags: ['carshi', 'food', 'corba', 'cigKofte', 'lahmacun', 'burger']
    },
    {
        name: 'Vero Cair',
        tags: ['cair', 'croissant', 'bread']
    },
    {
        name: 'Vero Taftalidze',
        tags: ['karposh', 'croissant', 'bread']
    },
    {
        name: 'Coffee Factory Debar Maalo',
        tags: ['karposh', 'coffee', 'dessert']
    },
    {
        name: 'Balat',
        tags: ['carshi', 'coffee', 'cocktails']
    },
    {
        name: 'Ristretto',
        tags: ['karposh', 'coffee', 'specialty']
    },
    {
        name: 'L\'angolo Di Caffe',
        tags: ['karposh', 'chill', 'coffee', 'dessert']
    },
    {
        name: 'Pastel',
        tags: ['karposh', 'croissant']
    },
    {
        name: 'Bottega del Gusto',
        tags: ['centar', 'pasta']
    },
    {
        name: 'Four',
        tags: ['karposh', 'luxury', 'chill', 'restaurant', 'coffee']
    },
    {
        name: 'Bella Vista East Gate',
        tags: ['aerodrom', 'restaurant', 'pancake', 'coffee']
    },
    {
        name: 'Healthyish Debar Maalo',
        tags: ['karposh', 'breakfast', 'juices']
    },
    {
        name: 'Garden',
        tags: ['karposh', 'restaurant', 'food', 'meats']
    },
    {
        name: 'Mr. Pizza',
        tags: ['karposh', 'food', 'pizza']
    },
    {
        name: 'MOIA',
        tags: ['karposh', 'chill', 'coffee', 'dessert']
    },
    {
        name: 'Healthyish Leptokarija',
        tags: ['karposh', 'breakfast', 'juices']
    },
    {
        name: 'Cafe Ottoman',
        tags: ['carshi', 'chill', 'coffee', 'juices']
    },
    {
        name: 'Coffee Factory Center',
        tags: ['centar', 'coffee', 'dessert']
    },
    {
        name: 'Sarajeva Steakhouse',
        tags: ['aerodrom', 'food', 'burger']
    },
    {
        name: 'Cafe Sach',
        tags: ['aerodrom', 'coffee']
    },
    {
        name: 'Destan East Gate',
        tags: ['aerodrom', 'food', 'kebap']
    },
    {
        name: 'Levant',
        tags: ['aerodrom', 'food', 'meats']
    },
    {
        name: 'SushiCo',
        tags: ['karposh', 'luxury', 'restaurant', 'food', 'sushi']
    },
    {
        name: 'Lukumades',
        tags: ['centar', 'dessert', 'iceCream']
    },
    {
        name: 'Destan Bunjakovec',
        tags: ['karposh', 'food', 'kebap']
    },
    {
        name: 'Saraevo',
        tags: ['carshi', 'food', 'corba', 'kebap']
    },
    {
        name: 'Teteks Carsija',
        tags: ['carshi', 'food', 'burger']
    },
    {
        name: 'Mulliri',
        tags: ['carshi', 'coffee', 'dessert']
    },
    {
        name: 'Anatolia',
        tags: ['centar', 'food', 'lahmacun', 'icliKofte']
    },
    {
        name: 'Fish Restaurant',
        tags: ['karposh', 'restaurant', 'food', 'fish']
    },
    {
        name: 'Caffe Izzi',
        tags: ['karposh', 'coffee']
    },
    {
        name: 'Miracoli',
        tags: ['karposh', 'restaurant', 'food', 'salad', 'meats']
    },
    {
        name: 'ChaCha',
        tags: ['cair', 'restaurant', 'food', 'pasta', 'meats']
    },
    {
        name: 'Routine',
        tags: ['cair', 'restaurant', 'coffee', 'dessert']
    },
    {
        name: '4us',
        tags: ['cair', 'food', 'burger']
    },
    {
        name: 'Delice',
        tags: ['carshi', 'coffee', 'croissant', 'dessert', 'fullCake']
    },
    {
        name: 'Milky',
        tags: ['karposh', 'coffee', 'dessert', 'pancake']
    },
    {
        name: 'Arabika',
        tags: ['cair', 'food', 'breakfast', 'coffee']
    },
    {
        name: 'Lusso',
        tags: ['karposh', 'coffee', 'specialty']
    },
    {
        name: 'Bravo',
        tags: ['cair', 'food', 'lahmacun', 'burger', 'dessert']
    },
    {
        name: 'Meydan',
        tags: ['cair', 'food', 'restaurant', 'dessert', 'baklava']
    },
    {
        name: 'Selo',
        tags: ['cair', 'food', 'cigKofte', 'burger']
    },
    {
        name: 'Scoop Artisan',
        tags: ['karposh', 'iceCream']
    },
    {
        name: 'Slatkogram',
        tags: ['karposh', 'dessert']
    },
    {
        name: 'Burger Zone',
        tags: ['cair', 'food', 'burger']
    },
    {
        name: 'Teteks Cair',
        tags: ['cair', 'food', 'burger']
    },
    {
        name: 'NoName',
        tags: ['cair', 'food', 'pizza']
    },
    {
        name: 'Malaga',
        tags: ['centar', 'iceCream']
    },
    {
        name: 'Viva Fresh',
        tags: ['cair', 'croissant']
    },
    {
        name: 'Mola Cafe',
        tags: ['carshi', 'coffee', 'juices']
    },
    {
        name: 'Ramce',
        tags: ['cair', 'food', 'breakfast', 'simitPogaca']
    },
    {
        name: 'MyWay Cafe',
        tags: ['carshi', 'coffee']
    },
    {
        name: 'Balkan Corner',
        tags: ['carshi', 'coffee', 'specialty']
    },
    {
        name: 'Miam Bakery & Cafe',
        tags: ['centar', 'breakfast', 'croissant', 'coffee']
    },
    {
        name: 'Cafe Paname',
        tags: ['karposh', 'chill', 'coffee', 'croissant', 'dessert']
    }
];

export default places;
