using MediaTagger.Data;
using Microsoft.EntityFrameworkCore;

namespace MediaTagger.Modules.Setting
{
    public static  class SettingsEndpoints
    {
    private const string V1_URL_PREFIX = "/api/v1";

    public static void MapEndpoints(this IEndpointRouteBuilder routes)
    {
      
      routes.MapGet(V1_URL_PREFIX + "/settings", async (MediaTaggerContext db) =>
            {
              return await db.Settings.ToListAsync();
            });

      routes.MapPost(V1_URL_PREFIX + "/settings/", async (SettingModel setting, MediaTaggerContext db) =>
      {
        db.Settings.Add(setting);
        await db.SaveChangesAsync();
        return Results.Created($"/Settings/{setting.Scope}", setting);
      });

      routes.MapGet(V1_URL_PREFIX + "/settings/app", async (ISettingService settings) =>
      {
        return await settings.GetAppSettings();
      });

      routes.MapPost(V1_URL_PREFIX + "/settings/app", async (AppSettings appSettings, ISettingService settingService, MediaTaggerContext db) =>
      {
       await settingService.SaveAppSettings(appSettings);
        return Results.Ok(appSettings);
      });
      routes.MapPut(V1_URL_PREFIX + "/settings/app", async (AppSettings appSettings, ISettingService settingService, MediaTaggerContext db) =>
      {
       await settingService.SaveAppSettings(appSettings);
        return Results.Ok(appSettings);
      });
    }
  }
}
