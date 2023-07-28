export interface Place {
    id: number;
    name: string;
    tags: string[];
    link?: string;
}

/*
Available tags:
luxury, coffee, specialty, work, croissant, breakfast, corba, bread,
salad, juices, cocktails, dessert, iceCream, baklava, pancake,
food, kebap, burger, fish, pasta, pizza
*/

const places: Place[] = [
    {
        id: 1,
        name: 'Oud Coffee Co.',
        tags: ['coffee', 'cocktails'],
        link: 'https://www.instagram.com/oudcoffeeco/'
    },
    {
        id: 2,
        name: 'Pizza Palace',
        tags: ['pizza', 'italian']
    },
    {
        id: 3,
        name: 'Luxurious Bistro',
        tags: ['luxury', 'cocktails']
    }
];

export default places;