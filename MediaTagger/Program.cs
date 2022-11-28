using MediaTagger.Data;
using Microsoft.EntityFrameworkCore;
using System.Configuration;
using MediaTagger.Controllers;
using MediaTagger.Models;
using MediaTagger.Services;

var builder = WebApplication.CreateBuilder(args);
// Add services to the container.
builder.Services.AddRazorPages();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddDbContext<MediaTaggerContext>(options =>
  options.UseSqlServer(builder.Configuration.GetConnectionString("MediaTaggerContext")));

builder.Services.AddSingleton<IBackgroundMessageService,BackgroundMessageService>();
builder.Services.AddHostedService<FileSystemService>();
var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
  app.UseExceptionHandler("/Error");
  // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
  app.UseHsts();
}

using (var scope = app.Services.CreateScope())
{
  var services = scope.ServiceProvider;

  var context = services.GetRequiredService<MediaTaggerContext>();
  context.Database.EnsureCreated();
  // DbInitializer.Initialize(context);
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

app.UseAuthorization();

app.MapRazorPages();
app.UseDeveloperExceptionPage();

app.MapTagEndpoints();
try
{
  app.Run();
} catch(Exception ex) { 
  Console.WriteLine(ex); 
}
