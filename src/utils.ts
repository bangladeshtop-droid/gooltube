export const triggerExternalAds = () => {
    try {
        if (typeof window !== 'undefined') {
            // Trigger Monetag / libtl SDK
            if (typeof (window as any).show_9955574 === 'function') {
                (window as any).show_9955574().catch((e: any) => console.log("Ad show error:", e));
            }
            
            // Trigger Adsgram if initialized
            if ((window as any).Adsgram) {
                // Since we don't know the blockId, we attempt a generic show on an instance if it exists
                // or try to init with a known blockId if provided. Usually index.html handles it, but just in case:
                console.log("Adsgram detected globally");
            }
        }
    } catch(e) {
        console.warn("External Ads trigger failed", e);
    }
};
