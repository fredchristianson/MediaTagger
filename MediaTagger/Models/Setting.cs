
using SqlExpress;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MediaTagger.Models
{
  public class Setting
  {
    [Key]
    [Column(Order =1)]
    public string Scope { get; set; } = String.Empty;
    
    [Key]
    [Column(Order = 2)]
    public string Name { get; set; } = String.Empty;
    public string Value { get; set; } = String.Empty;
  }
}
