import { motion } from "framer-motion";
import { Package, TrendingUp, Sun, ShoppingCart } from "lucide-react";

const features = [
  {
    icon: Package,
    title: "Stock Management",
    description: "Real-time inventory tracking with low-stock alerts and batch management.",
  },
  {
    icon: TrendingUp,
    title: "Profit & Loss",
    description: "Comprehensive financial analytics to maximize your pharmacy's profitability.",
  },
  {
    icon: Sun,
    title: "Seasonality Insights",
    description: "Predict demand patterns and prepare for seasonal medicine trends.",
  },
  {
    icon: ShoppingCart,
    title: "Smart Cart",
    description: "Streamlined ordering with auto-suggestions and quick checkout flow.",
  },
];

const FeatureCards = () => {
  return (
    <section className="py-20 bg-secondary/50">
      <div className="container mx-auto px-6">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Everything You Need
          </h2>
          <p className="mt-3 text-muted-foreground text-lg max-w-xl mx-auto">
            Powerful tools designed for modern pharmacy management
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              className="group bg-card rounded-xl p-6 shadow-[var(--card-shadow)] hover:shadow-[var(--card-shadow-hover)] transition-shadow duration-300 border border-border"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-card-foreground mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureCards;
