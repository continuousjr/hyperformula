/**
 * @license
 * Copyright (c) 2022 Handsoncode. All rights reserved.
 */

export enum StatType {
  /* build engine */
  BUILD_ENGINE_TOTAL = 'BUILD_ENGINE_TOTAL',
  PARSER = 'PARSER',
  GRAPH_BUILD = 'GRAPH_BUILD',
  COLLECT_DEPENDENCIES = 'COLLECT_DEPENDENCIES',
  PROCESS_DEPENDENCIES = 'PROCESS_DEPENDENCIES',
  TOP_SORT = 'TOP_SORT',
  BUILD_COLUMN_INDEX = 'BUILD_COLUMN_INDEX',
  EVALUATION = 'EVALUATION',
  VLOOKUP = 'VLOOKUP',
  /* crud adjustments */
  TRANSFORM_ASTS = 'TRANSFORM_ASTS',
  TRANSFORM_ASTS_POSTPONED = 'TRANSFORM_ASTS_POSTPONED',
  ADJUSTING_ADDRESS_MAPPING = 'ADJUSTING_ADDRESS_MAPPING',
  ADJUSTING_ARRAY_MAPPING = 'ADJUSTING_ARRAY_MAPPING',
  ADJUSTING_RANGES = 'ADJUSTING_RANGES',
  ADJUSTING_GRAPH = 'ADJUSTING_GRAPH',
  /* criterion cache */
  CRITERION_FUNCTION_FULL_CACHE_USED = 'CRITERION_FUNCTION_FULL_CACHE_USED',
  CRITERION_FUNCTION_PARTIAL_CACHE_USED = 'CRITERION_FUNCTION_PARTIAL_CACHE_USED',
  /* Serialization */
  SERIALIZE_ENGINE_TOTAL = 'SERIALIZE_ENGINE_TOTAL',
  DESERIALIZE_ENGINE_TOTAL = 'DESERIALIZE_ENGINE_TOTAL',
  DESERIALIZE_ENGINE_STATE = 'DESERIALIZE_ENGINE_STATE',
  BUILD_ENGINE_FROM_DESERIALIZED_STATE = 'BUILD_ENGINE_FROM_DESERIALIZED_STATE',
}
