/* eslint-disable */
"use client";

import { LEVEL_INCOME, LEVEL_THRESHOLDS } from "@/lib/constants";
import { formatINR } from "@/lib/formatters";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

export function LevelIncomeTable() {
  const levels = Object.entries(LEVEL_INCOME).map(([level, pct]) => ({
    level: parseInt(level),
    pct,
  }));

  const getRequirementForLevel = (level: number) => {
    if (level <= 5) return { vol: LEVEL_THRESHOLDS[0].volume, label: LEVEL_THRESHOLDS[0].label };
    if (level <= 10) return { vol: LEVEL_THRESHOLDS[1].volume, label: LEVEL_THRESHOLDS[1].label };
    return { vol: LEVEL_THRESHOLDS[2].volume, label: LEVEL_THRESHOLDS[2].label };
  };

  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Level Income Structure</h2>
          <p className="text-lg text-muted-foreground">
            Earn a percentage of your team's daily ROI, every single day. 
            Unlock more levels by increasing your active downline business volume.
          </p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto glass-card overflow-hidden"
        >
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[100px] font-bold">Level</TableHead>
                  <TableHead className="font-bold">Daily Income %</TableHead>
                  <TableHead className="text-right font-bold">Volume Required to Unlock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {levels.map(({ level, pct }) => {
                  const req = getRequirementForLevel(level);
                  
                  // Add subtle grouping visual
                  const isFirstOfGroup = level === 1 || level === 6 || level === 11;
                  
                  return (
                    <TableRow key={level} className={isFirstOfGroup ? "border-t-2 border-border/60" : ""}>
                      <TableCell className="font-semibold text-foreground">
                        Level {level}
                      </TableCell>
                      <TableCell className="text-accent font-medium">
                        {pct}% <span className="text-xs text-muted-foreground font-normal ml-1">of their ROI</span>
                      </TableCell>
                      <TableCell className="text-right">
                        {isFirstOfGroup ? (
                          <Badge variant="outline" className="bg-background">
                            Team Volume: {formatINR(req.vol)} ({req.label})
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground italic">Unlocked with {req.label}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
