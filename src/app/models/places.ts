export interface Place {
    id: number;
    name: string;
    tags: string[];
}

const places: Place[] = [
    {
      id: 1,
      name: 'Cozy Cafe',
      tags: ['coffee', 'pastries', 'cosy']
    },
    {
      id: 2,
      name: 'Pizza Palace',
      tags: ['pizza', 'italian', 'family-friendly']
    },
    {
      id: 3,
      name: 'Luxurious Bistro',
      tags: ['luxury', 'fine-dining', 'cocktails']
    }
  ];
  
  export default places;