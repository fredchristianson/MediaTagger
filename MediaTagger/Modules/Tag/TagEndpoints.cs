using SqlExpress;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MediaTagger.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;

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
      })
    .WithName("GetAllTags");


      routes.MapGet(V1_URL_PREFIX+"/xTag", async (MediaTaggerContext db, IHttpContextAccessor httpContextAccessor) =>
            {
              var session = httpContextAccessor.HttpContext?.Session;
                return await db.Tags.ToListAsync();
            })
            .WithName("GetAllTagsx");

            routes.MapGet(V1_URL_PREFIX+"/Tag/{id}", async (int ID, MediaTaggerContext db) =>
            {
                return await db.Tags.FindAsync(ID)
                    is TagModel model
                        ? Results.Ok(model)
                        : Results.NotFound();
            })
            .WithName("GetTagById");

            routes.MapPut(V1_URL_PREFIX+"/Tag/{id}", async (int ID, TagModel tag, MediaTaggerContext db) =>
            {
                var foundModel = await db.Tags.FindAsync(ID);

                if (foundModel is null)
                {
                    return Results.NotFound();
                }
                //update model properties here

                await db.SaveChangesAsync();

                return Results.NoContent();
            })
            .WithName("UpdateTag");

            routes.MapPost(V1_URL_PREFIX+"/Tag/", async (TagModel tag, MediaTaggerContext db) =>
            {
                db.Tags.Add(tag);
                await db.SaveChangesAsync();
                return Results.Created($"/Tags/{tag.ID}", tag);
            })
            .WithName("CreateTag");


            routes.MapDelete(V1_URL_PREFIX+"/Tag/{id}", async (int ID, MediaTaggerContext db) =>
            {
                if (await db.Tags.FindAsync(ID) is TagModel tag)
                {
                    db.Tags.Remove(tag);
                    await db.SaveChangesAsync();
                    return Results.Ok(tag);
                }

                return Results.NotFound();
            })
            .WithName("DeleteTag");
        }
    }
}
