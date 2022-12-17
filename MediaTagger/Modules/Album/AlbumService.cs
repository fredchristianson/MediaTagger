using MediaTagger.Data;
using MediaTagger.Modules.FileSystem;
using MediaTagger.Modules.MediaFile;
using MediaTagger.Modules.Album;
using Microsoft.EntityFrameworkCore;

namespace MediaTagger.Modules.Album
{
    public interface IAlbumService
    {
        Task<AlbumModel> Create(string name);
    }
    public class AlbumService : IAlbumService
    {
        private MediaTaggerContext db;
        private ILogger<AlbumService> logger;
        private IPathService pathService;

        public AlbumService(MediaTaggerContext context, IPathService path, ILogger<AlbumService> logger)
        {
            this.db = context;
            this.logger = logger;
            this.pathService = path;
        }



        public async Task<AlbumModel> Create(string name)
        {
            var groupModel = new AlbumModel();
            groupModel.Name = name;
            groupModel.CreatedOn = DateTime.Now;
            groupModel.ModifiedOn = groupModel.CreatedOn;

            var createdModel = await db.Albums.AddAsync(groupModel);
            return createdModel.Entity;
        }


    }
}
