# Generations

- Generations class runs de generation cycle for creatures
- Generations have a number of steps
- At the begining of a generation the map is **populated** with creatures
- At the end of a generation some creatures are **selected** and will be the parents of creatures at next generation


## Population strategies

- AsexualRandomPopulation
- AsexualZonePopulation
- Continuouspopulation: for first generation do a AsexualRandomPopulation
- RandomFixedGenePopulation


## Selection methods

- InsideReproductionAreaSelection: creatures inside reproduction area will be selected
- ContinuousSelection: all creatures born during current generation will be selected
- GreatestDistanceSelection: order creatures by distance covered and select a %
- ReproductionSelection: TBD
