using MediaTagger.Data;
using Microsoft.EntityFrameworkCore;

namespace MediaTagger.Modules.FileSystem
{
  public interface IPathService
  {
    public Task<PathModel> GetOrCreatePath(string pathValue);
  }

  public class PathService : IPathService
  {
    private MediaTaggerContext dbContext;
    private IDictionary<string,PathModel> pathCache = new Dictionary<string,PathModel>();

    public PathService(MediaTaggerContext db)
    {
      this.dbContext = db;
    }

    public async Task<PathModel> GetOrCreatePath(string pathValue)
    {

      var lowerPath = pathValue.ToLower();
      PathModel path = null;
      if (pathCache.TryGetValue(lowerPath,out path))
      {
        return path;
      }
      path = dbContext.Paths.FirstOrDefault(row => row.Value == lowerPath);
      if (path == null)
      {
        path = new PathModel();
        path.Value = lowerPath;
        var pathEntity = dbContext.Paths.Add(path);
        dbContext.SaveChanges();
      }
      pathCache.Add(lowerPath, path);
      return path;
    }
  }
}