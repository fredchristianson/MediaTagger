using MediaTagger.Data;
using MediaTagger.Modules.FileSystem;
using MediaTagger.Modules.MediaFile;
using MediaTagger.Modules.MediaGroup;
using Microsoft.EntityFrameworkCore;

namespace MediaTagger.Modules.MediaGroup
{
    public interface IMediaGroupService
    {
        Task<MediaGroupModel> Create(string name);
    }
    public class MediaGroupService : IMediaGroupService
    {
        private MediaTaggerContext db;
        private ILogger<MediaGroupService> logger;
        private IPathService pathService;

        public MediaGroupService(MediaTaggerContext context, IPathService path, ILogger<MediaGroupService> logger)
        {
            this.db = context;
            this.logger = logger;
            this.pathService = path;
        }



        public async Task<MediaGroupModel> Create(string name)
        {
            var groupModel = new MediaGroupModel();
            groupModel.Name = name;
            groupModel.Created = DateTime.Now;
            groupModel.Modified = groupModel.Created;

            var createdModel = await db.MediaGroups.AddAsync(groupModel);
            return createdModel.Entity;
        }


    }
}
