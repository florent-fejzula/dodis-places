export interface Place {
    name: string;
    tags: string[];
    location?: string;
    highlightedTags?: string[];
}

const places: Place[] = [
    {
        name: 'Oud Coffee Co.',
        tags: ['carshi', 'coffee', 'specialty', 'cocktails'],
        location: 'https://maps.app.goo.gl/uaLfNDi4RRuiKASf8',
        highlightedTags: ['cocktails']
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
        tags: ['karposh', 'luxury', 'food', 'pizza'],
        highlightedTags: ['pizza']
    },
    {
        name: 'The Dude',
        tags: ['karposh', 'chill', 'coffee', 'specialty'],
        highlightedTags: ['specialty']
    },
    {
        name: 'EG Spizzicotto',
        tags: ['aerodrom', 'breakfast', 'sandwich']
    },
    {
        name: 'Teeny Tajni',
        tags: ['karposh', 'breakfast', 'juices'],
        highlightedTags: ['breakfast']
    },
    {
        name: 'Lipa',
        tags: ['karposh', 'coffee', 'croissant']
    },
    {
        name: 'EG Mapo City',
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
        tags: ['karposh', 'luxury', 'restaurant', 'food', 'pasta'],
        highlightedTags: ['pasta']
    },
    {
        name: 'Dabov',
        tags: ['karposh', 'coffee', 'specialty'],
        highlightedTags: ['specialty']
    },
    {
        name: 'Eskimo',
        tags: ['centar', 'iceCream']
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
        tags: ['carshi', 'food', 'lahmacun', 'pizza']
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
        tags: ['carshi', 'breakfast', 'croissant', 'burek'],
        highlightedTags: ['burek']
    },
    {
        name: 'World of Coffee',
        tags: ['aerodrom', 'coffee', 'specialty']
    },
    {
        name: 'Destan',
        tags: ['carshi', 'food', 'kebap'],
        highlightedTags: ['kebap']
    },
    {
        name: 'Silbo',
        tags: ['karposh', 'croissant', 'bread']
    },
    {
        name: 'Gino',
        tags: ['centar', 'restaurant', 'food', 'pizza', 'dessert', 'fullCake'],
        highlightedTags: ['pizza']
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
       name: 'Face 2 Face',
       tags: ['carshi', 'chill', 'coffee', 'cocktails']
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
        name: 'EG Bella Vista',
        tags: ['aerodrom', 'restaurant', 'pancake', 'coffee'],
        highlightedTags: ['pancake']
    },
    {
        name: 'Healthyish Debar Maalo',
        tags: ['karposh', 'breakfast', 'juices']
    },
    {
        name: 'Garden',
        tags: ['gjorche-saraj', 'restaurant', 'food', 'meats']
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
        name: 'EG Sarajeva Steakhouse',
        tags: ['aerodrom', 'food', 'burger']
    },
    {
        name: 'EG Cafe Sach',
        tags: ['aerodrom', 'coffee']
    },
    {
        name: 'EG Destan',
        tags: ['aerodrom', 'food', 'kebap']
    },
    {
        name: 'EG Levant',
        tags: ['aerodrom', 'food', 'meats']
    },
    {
        name: 'SushiCo',
        tags: ['karposh', 'luxury', 'restaurant', 'food', 'sushi'],
        highlightedTags: ['sushi']
    },
    {
        name: 'Destan Bunjakovec',
        tags: ['karposh', 'food', 'kebap']
    },
    {
        name: 'Saraevo',
        tags: ['carshi', 'food', 'corba', 'kebap'],
        highlightedTags: ['corba']
    },
    {
        name: 'Teteks Carsija',
        tags: ['carshi', 'food', 'burger'],
        highlightedTags: ['burger']
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
        tags: ['karposh', 'restaurant', 'food', 'fish'],
        highlightedTags: ['fish']
    },
    {
        name: 'Miracoli',
        tags: ['gjorche-saraj', 'restaurant', 'food', 'salad', 'meats', 'fish'],
        highlightedTags: ['salad', 'fish']
    },
    {
        name: 'ChaCha',
        tags: ['cair', 'restaurant', 'food', 'pasta', 'meats'],
        highlightedTags: ['pasta', 'meats']
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
        tags: ['carshi', 'coffee', 'dessert', 'fullCake'],
        highlightedTags: ['dessert']
    },
    {
        name: 'Milky',
        tags: ['karposh', 'coffee', 'dessert', 'pancake'],
        highlightedTags: ['pancake']
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
        tags: ['cair', 'food', 'lahmacun', 'burger', 'dessert'],
        highlightedTags: ['burger']
    },
    {
        name: 'Meydan',
        tags: ['cair', 'food', 'restaurant', 'dessert', 'baklava']
    },
    {
        name: 'Selo',
        tags: ['cair', 'food', 'cigKofte', 'meats', 'doner'],
        highlightedTags: ['cigKofte']
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
        tags: ['cair', 'food', 'pizza'],
        highlightedTags: ['pizza']
    },
    {
        name: 'Malaga',
        tags: ['centar', 'iceCream']
    },
    {
        name: 'Mola Cafe',
        tags: ['carshi', 'coffee', 'juices']
    },
    {
        name: 'Ramce',
        tags: ['cair', 'food', 'breakfast', 'simitPogaca', 'burek'],
        highlightedTags: ['simitPogaca', 'burek']
    },
    {
        name: 'Balkan Corner',
        tags: ['carshi', 'coffee', 'specialty']
    },
    {
        name: 'Miam Bakery & Cafe',
        tags: ['centar', 'work', 'breakfast', 'croissant', 'coffee']
    },
    {
        name: 'Cafe Paname',
        tags: ['karposh', 'chill', 'coffee', 'croissant', 'dessert']
    },
    {
        name: 'M House',
        tags: ['centar', 'coffee', 'croissant', 'juices', 'dessert', 'bread', 'sandwich'],
        highlightedTags: ['croissant', 'sandwich', 'juices', 'bread']
    },
    {
        name: 'Sheherzada',
        tags: ['centar', 'dessert']
    },
    {
        name: 'Bratstvo',
        tags: ['carshi', 'food', 'pizza']
    },
    {
        name: 'Gallery 7',
        tags: ['carshi', 'food', 'lahmacun'],
        highlightedTags: ['lahmacun']
    },
    {
        name: 'Dose',
        tags: ['centar', 'food', 'breakfast', 'sandwich']
    },
    {
        name: 'Saman',
        tags: ['karposh', 'coffee', 'chill']
    },
    {
        name: 'K8',
        tags: ['carshi', 'pancake']
    },
    {
        name: 'Start',
        tags: ['centar', 'pancake']
    },
    {
        name: 'Noas Rooftop',
        tags: ['cair', 'restaurant', 'luxury', 'food', 'corba', 'salad', 'fish', 'meats', 'dessert']
    },
    {
        name: 'Abi Doner',
        tags: ['carshi', 'food', 'doner'],
        highlightedTags: ['doner']
    },
    {
        name: 'Carshija Steakhouse',
        tags: ['carshi', 'food', 'meats'],
        highlightedTags: ['meats']
    },
    {
        name: 'Destan Park',
        tags: ['karposh', 'food', 'kebap']
    },
    {
        name: 'Su Roastery',
        tags: ['centar', 'restaurant', 'food', 'meats', 'coffee', 'specialty', 'pancake'],
        highlightedTags: ['pancake', 'specialty']
    },
    {
        name: 'Bereket Bakery',
        tags: ['cair', 'breakfast', 'burek']
    },
    {
        name: 'Aksa',
        tags: ['cair', 'breakfast', 'burek']
    },
    {
        name: 'Palma',
        tags: ['aerodrom', 'iceCream', 'dessert']
    },
    {
        name: 'Melty',
        tags: ['aerodrom', 'chill', 'coffee', 'dessert']
    },
    {
        name: 'Cioccolati Italiani',
        tags: ['aerodrom', 'iceCream', 'coffee', 'dessert', 'croissant'],
        highlightedTags: ['iceCream']
    },
    {
        name: 'Botanika',
        tags: ['karposh', 'restaurant', 'salad']
    },
    {
        name: 'Arrosto',
        tags: ['aerodrom', 'coffee', 'specialty']
    },
    {
        name: 'Korab',
        tags: ['gjorche-saraj', 'restaurant', 'food', 'meats']
    },
    {
        name: 'Treska',
        tags: ['gjorche-saraj', 'restaurant', 'food', 'chill']
    },
    {
        name: 'SushiCo Zen',
        tags: ['centar', 'restaurant', 'luxury', 'food', 'sushi'],
        highlightedTags: ['sushi']
    },
    {
        name: 'Fontana',
        tags: ['gjorche-saraj', 'restaurant', 'food', 'meats']
    },
    {
        name: 'Amigos Zeleznicka',
        tags: ['centar', 'restaurant', 'food', 'pizza', 'dessert'],
        highlightedTags: ['pizza', 'dessert']
    },
    {
        name: 'Brick Bar',
        tags: ['centar', 'restaurant', 'chill', 'pancake', 'coffee', 'cocktails']
    },
    {
        name: 'Nomad Hospital',
        tags: ['centar', 'coffee', 'juices']
    },
    {
        name: 'Nero',
        tags: ['karposh', 'iceCream'],
        highlightedTags: ['iceCream']
    },
    {
        name: 'Pelister',
        tags: ['centar', 'restaurant', 'pasta', 'pizza']
    },
    {
        name: 'Hilton Hotel',
        tags: ['aerodrom', 'restaurant', 'luxury', 'breakfast', 'coffee']
    }
];

export default places;
