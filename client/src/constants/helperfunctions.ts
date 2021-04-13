/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
export function toTitleCase(str: string): string {
    return str.replace(/\w\S*/g, txt => {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

export function formatISOToHoursMinutes(time: string): string {
    const newTime = new Date(time);
    let hours = String(newTime.getHours() + 1);
    let minutes = String(newTime.getMinutes());
    if (Number(hours) < 10) {
        hours = '0' + hours;
    }
    if (Number(minutes) < 10) {
        minutes = '0' + minutes;
    }
    return `${hours}:${minutes}`;
}

export function extractISOMonthDateYear(iso: string | Date, materialUI = false): string | null {
    if (!iso)
        return null;

    const time = new Date(iso);
    if (materialUI) {
        // year-month-date
        const year = String(time.getFullYear());
        let month = String(time.getMonth() + 1);
        let date = String(time.getDate());
        if (Number(month) < 10) {
            month = '0' + month;
        }
        if (Number(date) < 10) {
            date = '0' + date;
        }
        const result = `${year}-${month}-${date}`;
        return result;
    }
    const result = `${time.getMonth() + 1}/${time.getDate()}/${time.getFullYear()}`;
    return result;
}


export function extractModelConstellation(data: any) {
    if (!data) {
        return {
            ingestionModel: {},
            modelObjects: [],
            assets: []
        }
    }
    const { Model, ModelObjectModelMaterialXref, ModelAssets, ModelObjects, ModelMaterialChannels, ModelMaterials } = data;
    const modelObjects: any = [];
    const assets: any = [];
    const ModelMaterialsHash = {};
    const ingestionModel = {
        ...Model
    };

    if (ModelMaterials) {
        ModelMaterials.forEach((modelMaterial) => {
            ModelMaterialsHash[modelMaterial.idModelMaterial] = {
                idModelMaterial: modelMaterial.idModelMaterial,
                Name: modelMaterial.Name,
                ModelMaterialChannel: []
            };
        });
    }

    if (ModelMaterialChannels) {
        ModelMaterialChannels.forEach((channel) => {
            if (ModelMaterialsHash[channel.idModelMaterial]) {
                ModelMaterialsHash[channel.idModelMaterial].ModelMaterialChannel.push(channel);
            }
        });
    }

    if (ModelObjects) {
        ModelObjects.forEach((modelObject) => {
            const modelObj = { ...modelObject };
            modelObj['ModelMaterials'] = [];
            modelObjects.push(modelObj);
        });
    }


    if (ModelObjectModelMaterialXref) {
        ModelObjectModelMaterialXref.forEach((xref) => {
            const ind = modelObjects.findIndex((modelObject) => modelObject.idModelObject === xref.idModelObject);
            if (ind !== -1) {
                modelObjects[ind].ModelMaterials.push(ModelMaterialsHash[xref.idModelMaterial]);
            }
        });
    }

    if (ModelAssets) {
        ModelAssets.forEach((asset) => assets.push({ assetName: asset.AssetName, assetType: asset.AssetType }));
    }

    return { ingestionModel, modelObjects, assets };
}
