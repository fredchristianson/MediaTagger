using MediaTagger.Data;
using Microsoft.EntityFrameworkCore;

namespace MediaTagger.Modules.Tag
{

    public class TagService
    {

        private ILogger<TagService> logger;
        private MediaTaggerContext dbContext;


        public TagService(MediaTaggerContext db,
          ILogger<TagService> logger)
        {
            this.logger = logger;
            this.dbContext = db;

        }

        public async Task<List<TagModel>> GetAllTags()
        {
            var tags = await dbContext.Tags.ToListAsync();

            return tags;
        }
    }
}
