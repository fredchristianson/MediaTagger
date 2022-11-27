using SqlExpress;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MediaTagger.Data;
using Microsoft.EntityFrameworkCore;

namespace MediaTagger.Models
{
  public class Tag
  {
    public Tag()
    {

    }

    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int ID{ get; set; }

    public string Name { get; set; } = String.Empty;
  }


public static class TagEndpoints
{
	public static void MapTagEndpoints (this IEndpointRouteBuilder routes)
    {
        routes.MapGet("/api/v1/Tag", async (MediaTaggerContext db) =>
        {
            return await db.Tags.ToListAsync();
        })
        .WithName("GetAllTags");

        routes.MapGet("/api/v1/Tag/{id}", async (int ID, MediaTaggerContext db) =>
        {
            return await db.Tags.FindAsync(ID)
                is Tag model
                    ? Results.Ok(model)
                    : Results.NotFound();
        })
        .WithName("GetTagById");

        routes.MapPut("/api/v1/Tag/{id}", async (int ID, Tag tag, MediaTaggerContext db) =>
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

        routes.MapPost("/api/v1/Tag/", async (Tag tag, MediaTaggerContext db) =>
        {
            db.Tags.Add(tag);
            await db.SaveChangesAsync();
            return Results.Created($"/Tags/{tag.ID}", tag);
        })
        .WithName("CreateTag");


        routes.MapDelete("/api/v1/Tag/{id}", async (int ID, MediaTaggerContext db) =>
        {
            if (await db.Tags.FindAsync(ID) is Tag tag)
            {
                db.Tags.Remove(tag);
                await db.SaveChangesAsync();
                return Results.Ok(tag);
            }

            return Results.NotFound();
        })
        .WithName("DeleteTag");
    }
}}
