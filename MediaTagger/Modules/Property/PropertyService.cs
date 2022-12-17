using MediaTagger.Data;
using Microsoft.EntityFrameworkCore;

namespace MediaTagger.Modules.Property
{

    public class PropertyService
    {

        private ILogger<PropertyService> logger;
        private MediaTaggerContext dbContext;


        public PropertyService(MediaTaggerContext db,
          ILogger<PropertyService> logger)
        {
            this.logger = logger;
            this.dbContext = db;

        }

        public async Task<List<PropertyModel>> GetAllProperties()
        {
            var properties = await dbContext.Properties.ToListAsync();

            return properties;
        }
    }
}
