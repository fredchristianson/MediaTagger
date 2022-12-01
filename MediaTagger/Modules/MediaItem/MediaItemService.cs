using MediaTagger.Data;
using MediaTagger.Modules.FileSystem;
using MediaTagger.Modules.MediaFile;
using Microsoft.EntityFrameworkCore;

namespace MediaTagger.Modules.MediaItem
{
  public interface IMediaItemService
  {
    Task<MediaItemModel> Create(MediaFileModel primaryFile);
    Task<MediaItemModel> GetOrCreate(MediaFileModel primaryFile);
  }
  public class MediaItemService : IMediaItemService
  {
    private MediaTaggerContext db;
    private ILogger<MediaItemService> logger;
    private IPathService pathService;

    public MediaItemService(MediaTaggerContext context, IPathService path, ILogger<MediaItemService> logger)
    {
      this.db = context;
      this.logger = logger;
      this.pathService = path;
    }

    public async Task<MediaItemModel> GetOrCreate(MediaFileModel file) {
      var name = CreateMediaName(file.Name);
      var item = await db.MediaItems.Where(item => item.Name == name).FirstOrDefaultAsync();
      if (item == null)
      {
        item = await Create(file);
      }
      return item;
    }

    public async Task<MediaItemModel> Create(MediaFileModel primaryFile)
    {
      var itemModel = new MediaItemModel();
      itemModel.Name = CreateMediaName(primaryFile.Name);
      itemModel.Created = DateTime.Now;
      itemModel.Modified = itemModel.Created;
      itemModel.PrimaryFile = primaryFile;


      var createdModel = await db.MediaItems.AddAsync(itemModel);
      return createdModel.Entity;
    }

    private string CreateMediaName(string name)
    {
      if (name.Contains("."))
      {
        name = name.Remove(name.LastIndexOf('.'));
      }
      return name;
      
    }
  }
}
