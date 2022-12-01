using MediaTagger.Data;
using MediaTagger.Hubs;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace MediaTagger.Modules.Tag
{

  public class TagService
  {
    private IHttpContextAccessor httpContextAccessor;
    private ILogger<TagService> logger;
    private MediaTaggerContext dbContext;
    private IHubContext<LogHub,ILogHub> logHub;
    private IHubContext<ImageHub> imageHub;

    public TagService(MediaTaggerContext db, 
      IHttpContextAccessor httpContextAccessor,
      IHubContext<LogHub,ILogHub> logHub,
      IHubContext<ImageHub> imageHub,
      ILogger<TagService> logger)
    {
      this.httpContextAccessor = httpContextAccessor;
      this.logger = logger;
      this.dbContext = db;
      this.logHub = logHub;
      this.imageHub = imageHub;
    }

    public async Task<List<TagModel>> GetAllTags()
    {
      var tags = await dbContext.Tags.ToListAsync();
      //logHub.SendMessage("get tags");
      _ = logHub.Clients.All.Debug("debug test");
      _ = logHub.Clients.All.Log(new LogTest());
      _ = imageHub.Clients.All.SendAsync("Update", "get tags");
      return tags;
    }
  }
}
