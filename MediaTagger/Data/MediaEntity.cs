using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public abstract class MediaEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public long Id { get; set; }

    public string Name { get; set; } = string.Empty;

    [Required]
    public DateTime CreatedOn { get; set; } = DateTime.Now;
    [Required]
    public DateTime ModifiedOn { get; set; } = DateTime.Now;

    [Required]
    public Boolean Hidden { get; set; } = false;
}