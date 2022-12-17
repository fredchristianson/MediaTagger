namespace MediaTagger.Modules.Property
{


    public static class PropertyEndpoints
    {
        private const string V1_URL_PREFIX = "/api/v1";

        public static void MapPropertyEndpoints(this IEndpointRouteBuilder routes)
        {

            routes.MapGet(V1_URL_PREFIX + "/Property", async (PropertyService service) =>
            {
                return await service.GetAllProperties();
            });


        }
    }
}
