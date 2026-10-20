// Shared fixture: expected uncompressed byte sizes of the entries in the
// mock PackratTest.zip. Used by the ZipFile test (a live utility) and the
// BagitReader test. Kept in its own module so live tests do not import from
// another test file.

export function getPackratTestFileSizeMap(includeDirs: boolean): Map<string, number> {
    const fileSizeMap: Map<string, number> = new Map<string, number>();
    fileSizeMap.set('PackratTest/bag-info.txt', 0);
    fileSizeMap.set('PackratTest/bagit.txt', 55);
    fileSizeMap.set('PackratTest/capture_data_photo.csv', 1084);
    fileSizeMap.set('PackratTest/data/nmnh_sea_turtle-1_low/camera/nmnh_sea_turtle-1_low-01.jpg', 245862);
    fileSizeMap.set('PackratTest/data/nmnh_sea_turtle-1_low/camera/nmnh_sea_turtle-1_low-02.jpg', 245161);
    fileSizeMap.set('PackratTest/data/nmnh_sea_turtle-1_low/raw/nmnh_sea_turtle-1_low-01.dng', 283616);
    fileSizeMap.set('PackratTest/data/nmnh_sea_turtle-1_low/raw/nmnh_sea_turtle-1_low-02.dng', 282558);
    fileSizeMap.set('PackratTest/manifest-sha1.txt', 410);
    fileSizeMap.set('PackratTest/tagmanifest-sha1.txt', 229);

    if (includeDirs) {
        fileSizeMap.set('PackratTest/data/', 0);
        fileSizeMap.set('PackratTest/data/nmnh_sea_turtle-1_low/', 0);
        fileSizeMap.set('PackratTest/data/nmnh_sea_turtle-1_low/camera/', 0);
        fileSizeMap.set('PackratTest/data/nmnh_sea_turtle-1_low/raw/', 0);
    }
    return fileSizeMap;
}
