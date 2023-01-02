using MediaTagger.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MediaTagger.Modules.FileSystem
{
    public enum FileSystemType
    {
        DRIVE,
        FOLDER,
        FILE
    };
    public class FileSystemItem
    {
        public string Name { get; set; } = null!;
        public string? Path { get; set; }
        public FileSystemType Type { get; set; }
        public bool HasFolders { get; set; } = true;
        public bool HasMedia { get; set; } = false;

    }
    public interface IFileSystemService
    {
        List<FileSystemItem> ChildFolders(string parent);
        List<FileSystemItem> TopFolders();
    }

    public class FileSystemService : IFileSystemService
    {
        private MediaTaggerContext dbContext;
        private ILogger<FileSystemService> logger;

        public FileSystemService(MediaTaggerContext db, ILogger<FileSystemService> logger)
        {
            this.dbContext = db;
            this.logger = logger;
        }

        public List<FileSystemItem> TopFolders()
        {
            List<FileSystemItem> items = new List<FileSystemItem>();
            var drives = System.IO.DriveInfo.GetDrives();
            foreach (var drive in drives)
            {
                var item = new FileSystemItem
                {
                    Name = drive.Name,
                    Path = drive.RootDirectory.FullName,
                    Type = FileSystemType.DRIVE
                };
                items.Add(item);
            }
            return items;
        }

        public List<FileSystemItem> ChildFolders(string parent)
        {
            List<FileSystemItem> items = new List<FileSystemItem>();
            var dir = new DirectoryInfo(parent);
            var dirInfo = dir.GetDirectories();
            foreach (var child in dirInfo)
            {
                var item = new FileSystemItem
                {
                    Name = child.Name,
                    Path = child.FullName,
                    Type = FileSystemType.FOLDER
                };
                items.Add(item);
            }
            return items;
        }

    }
}