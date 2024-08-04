export interface Recipe {
  name: string;
  image: string;
  category: string;
}

const recipes: Recipe[] = [
  {
    name: 'Buttered Bread',
    image:
      'https://t3.ftcdn.net/jpg/07/00/27/12/240_F_700271266_T4GY60vLNHkykE3etgwxPrAOc7XOXvKI.jpg',
    category: 'Breakfast',
  },
  {
    name: 'Bread with Eggs',
    image:
      'https://t3.ftcdn.net/jpg/03/76/03/40/240_F_376034011_cMWRxHWBOe5KnYFqp2adEYdPe2RCICMk.jpg',
    category: 'Breakfast',
  },
  {
    name: 'Vegetarian Sandwich',
    image:
      'https://t4.ftcdn.net/jpg/01/01/14/77/240_F_101147704_HLCVMsAvD5Yka525f6pglroky2SrDj6L.jpg',
    category: 'Breakfast',
  },
  {
    name: 'Eggs with Potatoes',
    image:
      'https://i.lezzet.com.tr/images-xxlarge-recipe/patatesli-yumurta-6e548dbb-97f9-4948-9157-56e45ecf398f.jpg',
    category: 'Breakfast',
  },
  {
    name: 'Eggs with Sucuk',
    image:
      'https://t3.ftcdn.net/jpg/04/63/21/18/240_F_463211843_AZzuqxDKFk6s2Wa2N7gxI5lScVbc35sp.jpg',
    category: 'Breakfast',
  },
  {
    name: 'Menemen',
    image:
      'https://t3.ftcdn.net/jpg/05/11/38/54/240_F_511385443_tljglSQp2rkC75hkXMKG6geyVKuRFjwP.jpg',
    category: 'Breakfast',
  },
  {
    name: 'Caprese Salad',
    image:
      'https://whatsgabycooking.com/wp-content/uploads/2023/06/Dinner-Party-__-Traditional-Caprese-1-1200x800-1.jpg',
    category: 'Salads',
  },
  {
    name: 'Amalfi Salad',
    image:
      'https://www.dinneratthezoo.com/wp-content/uploads/2020/12/christmas-salad-4-500x375.jpg',
    category: 'Salads',
  },
  {
    name: 'Salsa Salad',
    image:
      'https://www.cookingclassy.com/wp-content/uploads/2014/07/avocado-salsa4-edit2+srgb..jpg',
    category: 'Salads',
  },
  {
    name: 'Shopska Salad',
    image:
      'https://fortheloveofcheesenbread.com/wp-content/uploads/2023/07/9H7A3893-500x500.jpg',
    category: 'Salads',
  },
  {
    name: 'Greek Salad',
    image:
      'https://t3.ftcdn.net/jpg/02/97/13/58/360_F_297135896_Y9HQ2k7WRIWj55l7LMSB6zQBh3KJ7aBV.jpg',
    category: 'Salads',
  },
  {
    name: 'Bruschetta Toscana',
    image:
      'https://www.thespruceeats.com/thmb/nx89Z6BLT1WEPQGXAXZn-XY-Fh4=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/how-to-make-bruschetta-2020459-hero-01-15950eb2b852461abc9cfbbf536382dd.jpg',
    category: 'Appetizers',
  },
  {
    name: 'Anchovy Dip',
    image:
      'https://t3.ftcdn.net/jpg/07/04/57/50/240_F_704575027_UUHchYYJENCEpGDrsAN6TDSwOjQbgVPU.jpg',
    category: 'Appetizers',
  },
  {
    name: 'Mozzarella Sticks',
    image:
      'https://t4.ftcdn.net/jpg/08/12/30/59/240_F_812305908_GWoQwfHXNhM3qQcms9qbFmOzED4dNBCG.jpg',
    category: 'Appetizers',
  },
  {
    name: 'Pilav',
    image:
      'https://t3.ftcdn.net/jpg/00/72/88/84/240_F_72888419_dNzru4oFYVMo1R6jgNaBehVICKfjTScx.jpg',
    category: 'Sides',
  },
  {
    name: 'Saffron Pilav',
    image:
      'https://t3.ftcdn.net/jpg/05/22/86/64/240_F_522866429_JBYK1B3WeYgtfc57OStKI0VArey4b51r.jpg',
    category: 'Sides',
  },
  {
    name: 'Ic Pilav',
    image:
      'https://t3.ftcdn.net/jpg/05/40/34/20/240_F_540342090_K4L6wPISU8TL4A23DFtKf0evXYbbKMlm.jpg',
    category: 'Sides',
  },
  {
    name: 'Rosemary Garlic EVOO Potatoes',
    image:
      'https://t3.ftcdn.net/jpg/08/78/78/38/240_F_878783858_4o0jZLwLGCDlxZ6cfPSnVhw1Qm697xT0.jpg',
    category: 'Sides',
  },
  {
    name: 'Chili Broccoli',
    image:
      'https://t3.ftcdn.net/jpg/04/33/67/78/240_F_433677834_nPcRG27D4w2nAEEp9ZTEp3MFlqgBBiVp.jpg',
    category: 'Sides',
  },
  {
    name: 'Aglio e Olio',
    image:
      'https://t3.ftcdn.net/jpg/07/49/55/44/240_F_749554480_rL0BGw6r8lOjSJtG3DzNw1yYSBXro3FO.jpg',
    category: 'Pastas',
  },
  {
    name: 'Pasta Carbonara',
    image:
      'https://t4.ftcdn.net/jpg/02/60/30/15/240_F_260301530_BHupKXFZB6MEQbOgYnzAVoSDd6UpsUau.jpg',
    category: 'Pastas',
  },
  {
    name: 'Fusilli alla Genovese',
    image:
      'https://t3.ftcdn.net/jpg/07/12/27/62/240_F_712276228_acuHTcSX3pVLLJqAGiFLopU4sat3NcWG.jpg',
    category: 'Pastas',
  },
  {
    name: 'Penne Pomodore',
    image:
      'https://t3.ftcdn.net/jpg/08/10/13/22/240_F_810132281_HXr8sJy2bu06PVcb7q9LsbecrYCSTMd2.jpg',
    category: 'Pastas',
  },
  {
    name: 'Creamy Pasta',
    image:
      'https://as2.ftcdn.net/v2/jpg/07/43/76/33/1000_F_743763305_uEZQhuanJhq70be7Fsvnp2ABVu5rubWF.jpg',
    category: 'Pastas',
  },
  {
    name: 'Penne Gorgonzola',
    image:
      'https://t3.ftcdn.net/jpg/08/00/30/22/240_F_800302216_IDNLE8ZigOY4IVkPs0qsK7autpSB7msK.jpg',
    category: 'Pastas',
  },
  {
    name: 'Spaghetti Bolognese',
    image:
      'https://t3.ftcdn.net/jpg/01/09/75/90/240_F_109759077_SVp62TBuHkSn3UsGW4dBOm9R0ALVetYw.jpg',
    category: 'Pastas',
  },
  {
    name: 'Creamy Parmesan Sauce Chicken',
    image:
      'https://www.saltandlavender.com/wp-content/uploads/2021/02/creamy-garlic-parmesan-chicken-3-720x1080.jpg',
    category: 'Mains',
  },
  {
    name: 'Chicken Parmesan',
    image:
      'https://t3.ftcdn.net/jpg/07/03/10/64/240_F_703106490_5UgTD6FiZ518V34KXHccVeuEWiF5BZLf.jpg',
    category: 'Mains',
  },
  {
    name: 'Beef/Chicken Burrito',
    image:
      'https://t4.ftcdn.net/jpg/08/66/43/39/240_F_866433920_dwD9cNKLJp71kxBXePYBZCHZ1U73LxwB.jpg',
    category: 'Mains',
  },
  {
    name: 'Meat/Chicken Mushroom Gravy',
    image:
      'https://t4.ftcdn.net/jpg/05/31/10/55/240_F_531105536_WuHXoxFzQptiWY5mBskDM7MNCYrJbyDB.jpg',
    category: 'Mains',
  },
  {
    name: 'Hunkar Begendi',
    image:
      'https://t4.ftcdn.net/jpg/01/78/28/25/240_F_178282558_8eTXOhSnfPyey55eAHEHgLLvBS4sFieD.jpg',
    category: 'Mains',
  },
  {
    name: 'Etli Guvec Tava',
    image:
      'https://i.nefisyemektarifleri.com/2021/05/25/guvecte-patlicanli-et-tava-9.jpg',
    category: 'Mains',
  },
  {
    name: 'Slow Cooked Meat',
    image:
      'https://t3.ftcdn.net/jpg/03/00/99/12/240_F_300991228_aTbiETG6mbp15KMal20EoN9cXWSUPuSp.jpg',
    category: 'Mains',
  },
  {
    name: 'Mutancana',
    image:
      'assets/mutancana.jpeg',
    category: 'Mains',
  },
  {
    name: 'Hamsi Tava',
    image:
      'https://t4.ftcdn.net/jpg/03/06/21/23/240_F_306212390_Qqxy8q5HROFgVB0BAS3eGI1O1uQkJTjZ.jpg',
    category: 'Mains',
  },
  {
    name: 'Tuna Sandwich',
    image:
      'https://t3.ftcdn.net/jpg/05/03/46/24/240_F_503462429_wAmcWZrNXmVOdhl20Frw9yrxEZGOK3BX.jpg',
    category: 'Snacks',
  },
  {
    name: 'Fish Sticks with Tartar Sauce',
    image:
      'https://t4.ftcdn.net/jpg/07/22/91/79/240_F_722917963_LbRymWpO0gB1lGVCbe7lh57sjS2sitMM.jpg',
    category: 'Snacks',
  },
  {
    name: 'Tramezzini',
    image:
      'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhWXKRpVhy7x58bRp8eo43hU9xQH7OqL_k3lapFrZJtHexmEzV8Woo1O3ab0DUFLdWrHjknEHzApvis1WlW7Ao16tTRXgr7dp0WYNesh_NRvgrsavUIIS_T3uBvacBkFgyi91Fl938Enzut/s640-Ic42/PicsArt_1441815027762.jpg',
    category: 'Snacks',
  },
  {
    name: 'Crepes',
    image:
      'https://t4.ftcdn.net/jpg/07/51/61/35/240_F_751613596_MqtoCvCMdgkneRsO5TMVOGF4hYcd45nH.jpg',
    category: 'Desserts',
  },
  {
    name: 'Izmir Lokma',
    image:
      'https://t3.ftcdn.net/jpg/05/61/46/58/240_F_561465845_hN0CA8prmE5vevQ9FYBM82I7yAa3abl9.jpg',
    category: 'Desserts',
  },
  {
    name: 'Tufahija',
    image:
      'https://recepti-api.index.hr/img/preview/large/recipe-mobile/90110d11-0627-4842-9599-7d2002e44b09/shutterstock_1697876662-crop.jpg',
    category: 'Desserts',
  },
  {
    name: 'Lava Cake',
    image:
      'https://t4.ftcdn.net/jpg/03/67/03/05/240_F_367030550_mzTBPDuE7fZgymVnDay4EVPTDjJGPKe2.jpg',
    category: 'Desserts',
  }

];

export default recipes;
