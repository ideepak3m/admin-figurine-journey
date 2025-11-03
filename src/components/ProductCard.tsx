import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

interface ProductCardProps {
  image: string;
  title: string;
  description: string;
  price: string;
}

const ProductCard = ({ image, title, description, price }: ProductCardProps) => {
  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-lg">
      <div className="aspect-square overflow-hidden">
        <img
          src={image}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <CardContent className="p-6">
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
        <p className="text-2xl font-bold text-primary">{price}</p>
      </CardContent>
      <CardFooter className="p-6 pt-0 flex gap-2">
        <Button className="flex-1">Add to Cart</Button>
        <Button variant="outline" className="flex-1">
          Customize
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
