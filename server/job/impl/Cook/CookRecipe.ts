export class CookRecipe {
    id: string = '';
    name: string = '';
    description: string = '';
    version: string = '';

    private static CookRecipeMap: Map<string, CookRecipe> = new Map<string, CookRecipe>();
    private static CookRecipeMapInit: boolean = false;

    private static initCookRecipeMap(): void {
        if (this.CookRecipeMapInit)
            return;
        for (const CR of this.CookRecipeList)
            this.CookRecipeMap.set(CR.name, CR);
        this.CookRecipeMapInit = true;
    }

    static getCookRecipeID(recipeName: string, recipeIdDefault: string): string {
        this.initCookRecipeMap();
        const CR: CookRecipe | undefined = this.CookRecipeMap.get(recipeName);
        return CR?.id || recipeIdDefault;
    }

    // Recipe list fetched from http://si-3ddigip01.si.edu:8011/recipes
    // Recipe details from http://si-3ddigip01.si.edu:8011/recipes/$$ID$$
    private static CookRecipeList: CookRecipe[] = [
        {
            'id': '2fe782ca-93c4-4269-a06a-c764ad87558b',
            'name': 'bake',
            'description': 'Bake diffuse, occlusion, normal maps',
            'version': '1'
        },
        {
            'id': 'c92d4d0e-4404-4b9e-92ee-75a7e25e126a',
            'name': 'decimate-unwrap',
            'description': 'Decimate mesh and generate UV coordinates',
            'version': '1'
        },
        {
            'id': '7ce5c5b1-00d2-4d7f-bebc-ea99ae5f6640',
            'name': 'decimate',
            'description': 'Decimate high poly mesh',
            'version': '4'
        },
        {
            'id': 'a12161bb-265f-4979-80db-65f739dcc156',
            'name': 'generate-usdz',
            'description': 'Create usdz web asset',
            'version': '1'
        },
        {
            'id': '05debd35-efab-40d4-9145-cb6d819d1859',
            'name': 'generate-web-gltf',
            'description': 'Generates glTF/GLB web asset',
            'version': '13'
        },
        {
            'id': 'ee77ee05-d832-4729-9914-18a96939f205',
            'name': 'inspect-mesh',
            'description': 'Inspects a mesh and returns a report with results (mesh statistics, bounding box, material properties)',
            'version': '2'
        },
        {
            'id': 'ae568c31-4cca-402e-90ee-b0c802fe05cc',
            'name': 'si-ar-backfill-fix',
            'description': 'Generates AR derivatives and inserts into known good scene.',
            'version': '2'
        },
        {
            'id': 'fcef7b5c-2df5-4a63-8fe9-365dd1a5e39c',
            'name': 'si-generate-downloads',
            'description': 'Generates download packages based on master assets. Packages include full obj, low obj & gltf & glb, usdz & glb AR, (optional) medium obj & gltf',
            'version': '2'
        },
        {
            'id': '271d9c8d-08af-45db-a940-3f0115d0ba00',
            'name': 'si-orient-model-to-svx',
            'description': 'Orients a model (obj, ply) to match the supplied .svx',
            'version': '2'
        },
        {
            'id': 'bb602690-76c9-11eb-9439-0242ac130002',
            'name': 'si-packrat-inspect',
            'description': 'Inspects a mesh and returns two report with results for mesh statistics and material properties. USed by Packrat for validation.',
            'version': '1'
        },
        {
            'id': '5490a618-4ebd-4763-a96a-abb9062c786b',
            'name': 'si-voyager-asset',
            'description': 'Generate Voyager package from single unmodified asset',
            'version': '5'
        },
        {
            'id': '512211e5-f2e8-4723-93e9-e30116c88ab0',
            'name': 'si-voyager-scene',
            'description': 'Generates low, medium, high, and AR assets for full Voyager package.',
            'version': '4'
        },
        {
            'id': '967ed977-055e-41c8-a836-b1372be3b3ca',
            'name': 'unwrap',
            'description': 'Unwrap decimated mesh using RizomUV',
            'version': '3'
        }
    ];
}

