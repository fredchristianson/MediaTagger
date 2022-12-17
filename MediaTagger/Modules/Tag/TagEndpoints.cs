namespace MediaTagger.Modules.Tag
{


    public static class TagEndpoints
    {
        private const string V1_URL_PREFIX = "/api/v1";

        public static void MapTagEndpoints(this IEndpointRouteBuilder routes)
        {

            routes.MapGet(V1_URL_PREFIX + "/Tag", async (TagService service) =>
            {
                return await service.GetAllTags();
            });


        }
    }
}
