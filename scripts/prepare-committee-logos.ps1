param([string]$AssetDirectory = (Join-Path $PSScriptRoot '../public/assets/committees'))
Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @"
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;
public static class CommitteeAlpha {
 public static string Convert(string input, string output) {
  using(var source=new Bitmap(input)) {
   int w=source.Width,h=source.Height;
   using(var rgb=new Bitmap(w,h,PixelFormat.Format32bppArgb)) {
    using(var g=Graphics.FromImage(rgb))g.DrawImageUnscaled(source,0,0);
    var locked=rgb.LockBits(new Rectangle(0,0,w,h),ImageLockMode.ReadOnly,PixelFormat.Format32bppArgb);
    int stride=locked.Stride;byte[] data=new byte[stride*h];Marshal.Copy(locked.Scan0,data,0,data.Length);rgb.UnlockBits(locked);
    int tile=64,nx=(w+tile-1)/tile,ny=(h+tile-1)/tile;
    double[,] sums=new double[nx*ny,4];double[] global=new double[4],fg=new double[4];
    for(int y=0;y<h;y++)for(int x=0;x<w;x++) {
     int p=y*stride+x*4;double b=data[p],g=data[p+1],r=data[p+2];
     if(g>170 && Math.Abs(r-g)<22 && Math.Abs(g-b)<24) {
      int t=(y/tile)*nx+x/tile;sums[t,0]+=r;sums[t,1]+=g;sums[t,2]+=b;sums[t,3]++;
      global[0]+=r;global[1]+=g;global[2]+=b;global[3]++;
     }
     if(g<110 && r-g>40){fg[0]+=r;fg[1]+=g;fg[2]+=b;fg[3]++;}
    }
    for(int c=0;c<3;c++){global[c]/=Math.Max(1,global[3]);fg[c]/=Math.Max(1,fg[3]);}
    for(int t=0;t<nx*ny;t++)for(int c=0;c<3;c++)sums[t,c]=sums[t,3]>0?sums[t,c]/sums[t,3]:global[c];
    byte[] result=new byte[data.Length];int left=w,top=h,right=0,bottom=0,opaque=0,transparent=0;
    for(int y=0;y<h;y++)for(int x=0;x<w;x++) {
     int p=y*stride+x*4;double b=data[p],g=data[p+1],r=data[p+2],alpha=0;
     double[] color={r,g,b};
     if(g<145 && r-g>40)alpha=1;
     else if(!(g>165 && Math.Abs(r-g)<18 && Math.Abs(g-b)<22)) {
      double gx=Math.Max(0,Math.Min(nx-1,(double)x/tile-.5)),gy=Math.Max(0,Math.Min(ny-1,(double)y/tile-.5));
      int x0=(int)gx,y0=(int)gy,x1=Math.Min(nx-1,x0+1),y1=Math.Min(ny-1,y0+1);double dx=gx-x0,dy=gy-y0;
      double[] bg=new double[3],front=(double[])fg.Clone();
      for(int c=0;c<3;c++)bg[c]=(1-dy)*((1-dx)*sums[y0*nx+x0,c]+dx*sums[y0*nx+x1,c])+dy*((1-dx)*sums[y1*nx+x0,c]+dx*sums[y1*nx+x1,c]);
      bool found=false;
      for(int radius=1;radius<=4 && !found;radius++)for(int yy=Math.Max(0,y-radius);yy<=Math.Min(h-1,y+radius)&&!found;yy++)for(int xx=Math.Max(0,x-radius);xx<=Math.Min(w-1,x+radius);xx++) {
       int q=yy*stride+xx*4;if(data[q+1]<110 && data[q+2]-data[q+1]>40){front[0]=data[q+2];front[1]=data[q+1];front[2]=data[q];found=true;break;}
      }
      double numerator=0,denominator=0;
      for(int c=0;c<3;c++){double direction=bg[c]-front[c];numerator+=(bg[c]-color[c])*direction;denominator+=direction*direction;}
      alpha=Math.Max(0,Math.Min(1,numerator/Math.Max(1,denominator)));
      if(alpha<.035)alpha=0;
      if(alpha>0 && alpha<1)for(int c=0;c<3;c++)color[c]=Math.Max(0,Math.Min(255,(color[c]-(1-alpha)*bg[c])/alpha));
     }
     if(alpha>0){result[p]=(byte)Math.Round(color[2]);result[p+1]=(byte)Math.Round(color[1]);result[p+2]=(byte)Math.Round(color[0]);result[p+3]=(byte)Math.Round(alpha*255);if(alpha>=.2){left=Math.Min(left,x);right=Math.Max(right,x);top=Math.Min(top,y);bottom=Math.Max(bottom,y);}if(alpha==1)opaque++;}else transparent++;
    }
    int margin=Math.Max(8,(int)(Math.Max(right-left,bottom-top)*.025));left=Math.Max(0,left-margin);top=Math.Max(0,top-margin);right=Math.Min(w-1,right+margin);bottom=Math.Min(h-1,bottom+margin);
    using(var final=new Bitmap(w,h,PixelFormat.Format32bppArgb)) {
     var bits=final.LockBits(new Rectangle(0,0,w,h),ImageLockMode.WriteOnly,PixelFormat.Format32bppArgb);Marshal.Copy(result,0,bits.Scan0,result.Length);final.UnlockBits(bits);
     using(var crop=final.Clone(new Rectangle(left,top,right-left+1,bottom-top+1),PixelFormat.Format32bppArgb))crop.Save(output,ImageFormat.Png);
    }
    return System.IO.Path.GetFileName(output)+": "+(right-left+1)+"x"+(bottom-top+1)+", transparent pixels="+transparent+", intact opaque pixels="+opaque;
   }
  }
 }
}
"@
Get-ChildItem -LiteralPath $AssetDirectory -Filter '*.jpg' | ForEach-Object {
 $destination=Join-Path $_.DirectoryName ($_.BaseName + '-transparent.png')
 [CommitteeAlpha]::Convert($_.FullName,$destination)
}
