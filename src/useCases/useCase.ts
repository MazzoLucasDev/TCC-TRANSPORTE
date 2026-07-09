export interface UseCase<InputDto, OutputDTO> {
  execute(input: InputDto): Promise<OutputDTO>;
}
